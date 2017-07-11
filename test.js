(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
			(global.AppCache = factory());
}(this, function () {
	'use strict';

	var keys = Object.keys;

	//so we can use db.table
	function setApiOnPlace(objs, tableNames, db) {
		tableNames.forEach(function (tableName) {
			var tableInstance = db._tableFactory(tableName);
			objs.forEach(function (obj) {
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

		this.name = name;
		this.tables = this._cfg.tables;
		this._db = this;
	}

	PlusStorageDb.prototype = {
		/*与Dexie api兼容性考虑*/
		version: function (num) {
			return this;
		},

		stores: function (stores) {
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

		get: function (key) {
			return this._getSync(key);
		},

		_getSync: function (key) {
			var realKey = this._generateKey(key);
			var jsonStr = this._service().getItem(realKey);
			var result = JSON.parse(jsonStr);

			return result;
		},

		set: function (value) {
			var self = this;
			value = typeof value === 'object' ? value : JSON.parse(value);
			var key = value[self.primaryKey],
				realKey = self._generateKey(key);

			value = JSON.stringify(value);
			self._service().setItem(realKey, value);
		},

		remove: function (key) {
			var self = this;
			var realKey = self._generateKey(key);
			self._service().removeItem(realKey);
		},

		count: function () {
			var self = this;
			var exp = new RegExp("^" + self.name + "\\..+");
			var len = 0,
				service = self._service();

			for (var i = 0; i < self._getLength(); i++) {
				var keyName = service.key(i);
				if (!exp.test(keyName)) continue;
				len++;
			}

			return len;
		},

		gets: function () {
			return this._getsSync();
		},

		_getsSync: function () {
			var self = this;
			var exp = new RegExp("^" + self.name + "\\..+");
			var arr = [],
				service = self._service();

			for (var i = 0; i < self._getLength(); i++) {
				var keyName = service.key(i);

				if (!exp.test(keyName)) continue;
				var item = self._getSync(keyName.substring(self.name.length + 1));
				arr.push(item);
			}

			return arr;
		},

		orderBy: function (sortField) {
			var list = this.gets();
			if (sortField) {
				return new OrderResult();
			}
		},

		getList: function (num, sortField) {
			var self = this;
			return self._getSortedList(num, sortField);
		},

		_getSortedList: function (num, sortField) {
			var self = this;
			var result = new Array();
			var list = self._getsSync();

			if (!sortField || !(sortField in list[0]))
				return list;

			list.sort(function (a, b) {
				if (a[sortField] > b[sortField]) return 1;
				if (a[sortField] < b[sortField]) return -1;
				return 0;
			});

			var curNum = (!num || num <= 0) ? list.length : (list.length > num ? num : list.length);
			for (var i = 0; i < curNum; i++) {
				result.push(list[i]);
			}

			return result;
		},

		getFirst: function (isDefault, sortField) {
			var self = this;
			var result = self._getSortedList(1, sortField);
			return result.length ? result[0] : (isDefault ? {} : null);
		},

		getLast: function (sortField) {
			var self = this;
			var count = _self.count();
			var result = self._getSortedList(count, sortField);
			return result ? result[result.length - 1] : null;
		},

		setList: function (items) {
			var self = this;
			for (var i = 0; i < items.length; i++) {
				self.set(items[i]);
			}
		},

		clear: function () {
			var self = this;
			var exp = new RegExp("^" + self.name + "\\..+");
			var service = self._service();
			var keyNames = [];

			//暂时遍历所有key
			for (var i = 0, len = self._getLength(); i < len; i++) {
				var keyName = service.key(i);
				if (!exp.test(keyName)) continue;
				keyNames.push(keyName);
			}

			for (var i = 0; i < keyNames.length; i++) {
				service.removeItem(keyNames[i]);
			}
		},

		//rule: tableName.primaryKey,  the value of the key
		_generateKey: function (primaryKey) {
			if (!primaryKey) {
				throw "primaryKey must by provided!";
			}

			var prefix = this.name + "." + primaryKey;

			return prefix;
		},

		_service: function () {
			return window.plus.storage;
		},

		_getLength: function () {
			return window.plus.storage.getLength();
		}
	};

	//排序中間結果
	function OrderResult(list, sortField, direction) {
		this.result = list;
		this.sortField = sortField;
		this.direction = direction;

		function _init() {
			if (!sortField || !(sortField in list[0]))
				return list;

			list.sort(function (a, b) {
				if (a[sortField] > b[sortField]) {
					if (direction == "asc") return 1;
					if (direction == "desc") return -1;
				}
				if (a[sortField] < b[sortField]) {
					if (direction == "asc") return -1;
					if (direction == "desc") return 1;
				}
				return 0;
			});
		}
	}

	function LocalTable(name, db) {
		this.name = name;
		this._db = db;
	}

	//提供对外API操作
	LocalTable.prototype = {

		get: function (key) {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].get(key);
		},

		gets: function () {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].gets();
		},

		getList: function (sortField, num) {
			var db = this._db._realDb;
			var tableName = this.name;
			return db[tableName].getList(sortField, num);
		},

		getFirst: function (sortField) {
			var db = this._db._realDb;
			var tableName = this.name;
			return db[tableName].getFirst(sortField);
		},

		getLast: function (sortField) {
			var db = this._db._realDb;
			var tableName = this.name;
			return db[tableName].getLast(sortField);
		},

		setList: function (items) {
			var db = this._db._realDb;
			var tableName = this.name;
			return db[tableName].setList(items);
		},

		set: function (key, value) {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].set(key, value);
		},

		count: function () {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].count();
		},

		remove: function (key) {
			var db = this._db._realDb;
			var tableName = this.name;

			return db[tableName].remove(key);
		},

		clear: function () {
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

		this.stores = function (stores) {
			//调用原生的stores
			this._realDb.version(1).stores(stores);

			this._cfg.storeSource = stores;
			setApiOnPlace([this._db], keys(stores), this._db);
			return this;
		};

		this._db = this;

		function createRealDb(name, dbType) {
			return new PlusStorageDb(name, 'plusStorage');
		}
	}

	return LocalDB;
}))

var appCache = new AppCache('appcache');



