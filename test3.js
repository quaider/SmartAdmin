(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		(global.Local = factory());
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
	function PlusStorageDb() {
		this._cfg = {
			storeSource: {},
			tables: []
		}

		this._tableFactory = function createTable(name) {
			var table = new Table(name);
			this._cfg.tables.push(table);

			return table;
		};

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

	function Table(name) {
		this.name = name;
	}

	Table.prototype = {

		get: function(key) {

			return new Dexie.Promise(function(resolve, reject) {

				var realKey = this._generateKey(key);
				var jsonStr = this._service().getItem(realKey);
				var result = JSON.parse(jsonStr);

				resolve(result);
			});
		},

		set: function(key, value) {

			return new Dexie.Promise(function(resolve, reject) {

				var realKey = this._generateKey(key);
				if(typeof value === 'object') {
					value = JSON.stringify(value);
				}

				this._service().setItem(realKey, value);

				resolve();
			});
		},

		remove: function(key) {
			var realKey = this._generateKey(key);
			this._service().removeItem(realKey);
		},

		count: function() {
			var table = this;
			var exp = new RegExp("^" + table.name + "\\..+");
			var len = 0,
				service = table._service();

			//暂时遍历所有key
			for(var i = 0; i < service.getLength(); i++) {
				var keyName = service.key(i);
				if(!exp.test(keyName)) continue;
				len++;
			}

			return len;
		},

		gets: function() {
			var table = this;
			var exp = new RegExp("^" + table.name + "\\..+");
			var arr = [],
				service = table._service();

			//暂时遍历所有key
			for(var i = 0; i < service.getLength(); i++) {
				var keyName = service.key(i);

				if(!exp.test(keyName)) continue;
				var item = table.get(keyName.substring(table.name.length + 1));
				arr.push(item);
			}

			return arr;
		},

		clear: function() {
			var table = this;
			var exp = new RegExp("^" + table.name + "\\..+");
			var service = table._service();
			var keyNames = [];

			//暂时遍历所有key
			for(var i = 0, len = service.getLength(); i < len; i++) {
				var keyName = service.key(i);
				if(!exp.test(keyName)) continue;
				keyNames.push(keyName);
			}

			for(var i = 0; i < keyNames.length; i++) {
				service.removeItem(keyNames[i]);
			}
		},

		toArray: function() {
			return this.gets();
		},

		//person.primaryKey  {name:12, age:23}
		_generateKey: function(primaryKey) {
			if(!primaryKey) {
				throw "primaryKey must by provided!";
			}

			var prefix = this.name + "." + primaryKey;

			return prefix;
		},

		_service: function() {
			//		this.service = plus.storage;
			return plus.storage;
		}
	};

	function LocalTable(name, db) {
		this.name = name;
		this._db = db;
	}

	LocalTable.prototype = {

		get: function(key) {
			var db = this._db._realDb;
			var tableName = this.name;
			var useIndexDb = this._db.useIndexDb;

			return new Dexie.Promise(function(resolve, reject) {
				db[tableName].get(key).then(function(item) {
					resolve(item);
				});
			});

		},

		gets: function() {
			var db = this._db._realDb;
			var tableName = this.name;
			var useIndexDb = this._db.useIndexDb;

			return new Dexie.Promise(function(resolve, reject) {
				if(useIndexDb) {
					db[tableName].toArray().then(function(arr) {
						resolve(arr);
					});
				} else {
					resolve(db[tableName].gets());
				}
			});
		},

		set: function(key, value) {

			var db = this._db._realDb;
			var tableName = this.name;
			var useIndexDb = this._db.useIndexDb;

			return new Dexie.Promise(function(resolve, reject) {
				if(useIndexDb) {

				} else {
					resolve(db[tableName].set(key, value));
				}

				db[tableName].put(value).then(function(item) {
					resolve(item);
				});
			});
		},

		len: function() {
			var db = this._db._realDb;
			var tableName = this.name;
			var useIndexDb = this._db.useIndexDb;

			return new Dexie.Promise(function(resolve, reject) {
				if(useIndexDb) {
					db[tableName].count().then(function(item) {
						resolve(item);
					});
				} else {
					resolve(db[tableName].len());
				}
			});
		},

		remove: function(key) {
			var db = this._db._realDb;
			var tableName = this.name;
			var useIndexDb = this._db.useIndexDb;

			return new Dexie.Promise(function(resolve, reject) {
				if(useIndexDb) {
					db[tableName].delete(key).then(function() {
						resolve();
					});
				} else {
					resolve(db[tableName].remove(key));
				}
			});
		},

		clear: function() {
			var db = this._db._realDb;
			var tableName = this.name;
			var useIndexDb = this._db.useIndexDb;

			return new Dexie.Promise(function(resolve, reject) {
				if(useIndexDb) {
					db[tableName].clear().then(function() {
						resolve();
					});
				} else {
					resolve(db[tableName].clear());
				}
			});
		}
	};

	var _useIndexDb;

	/*
	 * 存储实现
	 */
	function Local(name, useIndexDb) {

		this._cfg = {
			storeSource: {},
			tables: []
		};

		this.name = name;

		this.useIndexDb = useIndexDb;
		this._realDb = createRealDb(name, useIndexDb)

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

		function createRealDb(name, useIndexDb) {
			if(useIndexDb) {
				return new Dexie(name);
			}

			return new PlusStorageDb(name);
		}

	}

	return Local;
}))
