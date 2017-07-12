(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		(global.LocalDB = factory());
}(this, function() {
	'use strict';

	var keys = Object.keys;

	//so we can use db.table
	function setApiOnPlace(objs, tableNames, db) {
		tableNames.forEach(function(tableName) {
			var tableInstance = db._tableFactory(tableName);
			objs.forEach(function(obj) {
				tableName in obj || (obj[tableName] = tableInstance);
			});
		});
	}

	//plusStoreage存储包装
	function PlusStorageDb(name, storeType) {
		this._cfg = {
			storeType: storeType,
			storeSource: {},
			tables: []
		}

		this._tableFactory = function createTable(name) {
			var table = new Table(name, this);
			this._cfg.tables.push(table);

			return table;
		};
		
		//no used
		this.name = name;

		this.tables = this._cfg.tables;

		this._db = this;
	}

	PlusStorageDb.prototype = {
		/*与Dexie api兼容性考虑*/
		version: function(num) {
			return this;
		},

		stores: function(stores) {
			this._cfg.storeSource = stores;
			setApiOnPlace([this._db], keys(stores), this._db);
			return this;
		}
	}

	function Table(name, db) {
		this.name = name;
		this._db = db;
		/*默认第一个作为主键，暂不支持联合主键*/
		this.primaryKey = this._db._cfg.storeSource[name].split(',')[0];
	}

	Table.prototype = {

		get: function(key) {
			var self = this;
			return new Dexie.Promise(function(resolve, reject) {
				resolve(self._getSync(key));
			});
		},

		_getSync: function(key) {
			var realKey = this._generateKey(key);
			var jsonStr = this._service().getItem(realKey);
			var result = JSON.parse(jsonStr);

			return result;
		},

		set: function(value) {
			var self = this;
			return new Dexie.Promise(function(resolve, reject) {
				value = typeof value === 'object' ? value : JSON.parse(value);
				var key = value[self.primaryKey],
					realKey = self._generateKey(key);

				value = JSON.stringify(value);
				self._service().setItem(realKey, value);
				resolve();
			});
		},

		remove: function(key) {
			var self = this;
			return new Dexie.Promise(function(resolve, reject) {
				var realKey = self._generateKey(key);
				self._service().removeItem(realKey);
				resolve();
			});

		},

		count: function() {
			var self = this;
			return new Dexie.Promise(function(resolve, reject) {
				var exp = new RegExp("^" + self.name + "\\..+");
				var len = 0,
					service = self._service();

				//暂时遍历所有key
				for(var i = 0; i < self._getLength(); i++) {
					var keyName = service.key(i);
					if(!exp.test(keyName)) continue;
					len++;
				}

				resolve(len);
			});
		},

		gets: function() {
			var self = this;
			return new Dexie.Promise(function(resolve, reject) {
				var arr = self._getsSync();
				resolve(arr);
			});
		},

		_getsSync: function() {
			var self = this;
			var exp = new RegExp("^" + self.name + "\\..+");
			var arr = [],
				service = self._service();

			//暂时遍历所有key
			for(var i = 0; i < self._getLength(); i++) {
				var keyName = service.key(i);

				if(!exp.test(keyName)) continue;
				var item = self._getSync(keyName.substring(self.name.length + 1));
				arr.push(item);
			}

			return arr;
		},

		getList: function(sortField, num) {
			var self = this;
			sortField = sortField || 'CreateDate';
			return new Dexie.Promise(function(resolve, reject) {
				var result = self._getSortedList(sortField, num);
				resolve(result);
			});
		},

		_getSortedList: function(sortField, num) {
			if(!sortField || typeof sortField != 'string') throw 'must provided sort field with type string';
			var self = this;
			var result = new Array();

			var list = self._getsSync().sort(function(a, b) {
				if(!(sortField in a)) throw 'the item of specific list does not exists property `' + sortField + '`';
				if(a[sortField] > b[sortField]) return 1;
				if(a[sortField] < b[sortField]) return -1;
				return 0;
			});

			var curNum = (!num || num <= 0) ? list.length : (list.length > num ? num : list.length);
			for(var i = 0; i < curNum; i++) {
				result.push(list[i]);
			}

			return result;
		},

		getFirst: function(sortField) {
			var self = this;
			sortField = sortField || 'CreateDate';
			return new Dexie.Promise(function(resolve, reject) {
				var result = self._getSortedList(sortField, 1);
				resolve(result.length ? result[0] : null);
			});
		},

		getLast: function(sortField) {
			var self = this;
			sortField = sortField || 'CreateDate';
			return new Dexie.Promise(function(resolve, reject) {
				var result = self._getSortedList(sortField);
				resolve(result[result.length - 1]);
			});
		},

		setList: function(items) {
			var self = this;
			return new Dexie.Promise(function(resolve, reject) {
				for(var i = 0; i < items.length; i++) {
					self.set(items[i]);
				}

				resolve();
			})
		},

		clear: function() {
			var self = this;
			return new Dexie.Promise(function(resolve, reject) {
				var exp = new RegExp("^" + self.name + "\\..+");
				var service = self._service();
				var keyNames = [];

				//暂时遍历所有key
				for(var i = 0, len = self._getLength(); i < len; i++) {
					var keyName = service.key(i);
					if(!exp.test(keyName)) continue;
					keyNames.push(keyName);
				}

				for(var i = 0; i < keyNames.length; i++) {
					service.removeItem(keyNames[i]);
				}

				resolve();
			});
		},

		//rule: tableName.primaryKey
		_generateKey: function(primaryKey) {
			if(!primaryKey) {
				throw "primaryKey must by provided!";
			}

			var prefix = this.name + "." + primaryKey;

			return prefix;
		},

		_service: function() {
			var storeType = this._db._cfg.storeType;
			if(storeType === "plusStorage") {
				return window.plus.storage;
			}
			return window.localStorage;
		},

		_getLength: function() {
			var storeType = this._db._cfg.storeType;
			if(storeType === "plusStorage")
				return window.plus.storage.getLength();

			return window.localStorage.length;
		}
	};

	function IndexDb(name) {
		this.name = name;
		this._dexieDb = new Dexie(name);

		this._cfg = {
			storeSource: {},
			tables: [],
			version: 1
		};

		this.version = function(version) {
			this._cfg.version = version || 1;
			return this;
		}

		this._tableFactory = function createTable(name) {
			var table = new IndexDbTable(name, this);
			this._cfg.tables.push(table);
			return table;
		};

		this.stores = function(stores) {
			var version = this._cfg.version;
			this._cfg.storeSource = stores;

			this._dexieDb.version(version).stores(stores);
			setApiOnPlace([this._db], keys(stores), this._db);

			return this;
		}

		this._db = this;
	}

	function IndexDbTable(name, db) {
		this._db = db._dexieDb;
		this._table = this._db.table(name);
	}

	IndexDbTable.prototype = {

		get: function(key) {
			return this._table.get(key);
		},

		set: function(value) {
			return this._table.put(value);
		},

		remove: function(key) {
			return this._table.delete(key);
		},

		count: function() {
			return this._table.count();
		},

		gets: function() {
			return this._table.toArray();
		},

		getList: function(sortField, num) {
			if(!num) return this._table.orderBy(sortField).toArray();
			return this._table.orderBy(sortField).limit(num).toArray();
		},

		getFirst: function(sortField) {
			return this._table.orderBy(sortField).first();
		},

		getLast: function(sortField) {
			return this._table.orderBy(sortField).last();
		},

		setList: function(items) {
			return this._table.bulkPut(items);
		},

		clear: function() {
			return this._table.clear();
		}
	};

	function LocalTable(name, db) {
		this.name = name;
		this._db = db;
	}

	//提供对外API操作
	LocalTable.prototype = {

		get: function(key) {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].get(key);
		},

		gets: function() {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].gets();
		},

		getList: function(sortField, num) {
			var db = this._db._realDb;
			var tableName = this.name;
			return db[tableName].getList(sortField, num);
		},

		getFirst: function(sortField) {
			var db = this._db._realDb;
			var tableName = this.name;
			return db[tableName].getFirst(sortField);
		},

		getLast: function(sortField) {
			var db = this._db._realDb;
			var tableName = this.name;
			return db[tableName].getLast(sortField);
		},

		setList: function(items) {
			var db = this._db._realDb;
			var tableName = this.name;
			return db[tableName].setList(items);
		},

		set: function(key, value) {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].set(key, value);
		},

		count: function() {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].count();
		},

		remove: function(key) {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].remove(key);
		},

		clear: function() {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].clear();
		}
	};

	/*
	 * 存储实现
	 */
	function LocalDB(name, dbType) {

		this._cfg = {
			storeSource: {},
			tables: []
		};

		this.name = name;

		this.dbType = dbType;
		this._realDb = createRealDb(name, dbType)

		this._tableFactory = function createTable(name) {
			var table = new LocalTable(name, this);
			this._cfg.tables.push(table);
			return table;
		};

		this.stores = function(stores) {
			//调用原生的stores
			this._realDb.version(1).stores(stores);

			this._cfg.storeSource = stores;
			setApiOnPlace([this._db], keys(stores), this._db);
			return this;
		};

		this._db = this;

		function createRealDb(name, dbType) {
			if(dbType === "localStorage" || dbType === "plusStorage") {
				return new PlusStorageDb(name, dbType);
			}

			return new IndexDb(name);
		}
	}

	return LocalDB;
}))

/*others*/
function _database() {
	this.name = 'myDB';
	this.version = 1;
	this.stores = {
		news: 'id,guid,title,author,cover,time'
	};
};

_database.prototype = {
	initDB: function(migration) {
		var db = new Dexie(this.name);
		db.version(this.version).stores(this.stores).upgrade(function(trans) {
			if(migration && typeof migration === 'function') {
				console.log('indexDb 执行了迁移逻辑');
				migration(trans);
			}
		});

		return db;
	},

	/*
	 * 传入store name序列
	 */
	getDB: function() {
		var stores = {},
			self = this;
		//传入 stroe names，如 store1,store2
		for(var i = 0; i < arguments.length; i++) {
			var storeName = arguments[i];
			if(!self.stores[storeName]) continue;

			stores[storeName] = self.stores[storeName];
		}

		var db = new Dexie(this.name);
		db.version(this.version).stores(stores);

		return db;
	}
};

window.database = new _database();
