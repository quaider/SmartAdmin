(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		(global.Local = factory());
}(this, function () {
	'use strict';

	var keys = Object.keys;

	//so we can use db.tableName
	function setApiOnPlace(objs, tableNames, db) {
		tableNames.forEach(function (tableName) {
			var tableInstance = db._tableFactory(tableName);
			objs.forEach(function (obj) {
				tableName in obj || (obj[tableName] = tableInstance);
			});
		});
	}

	//plus storeage
	function PlusStorageDb() {
		this._cfg = {
			storeSource: {},
			version: 1,
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
		version: function (version) {
			this._cfg.version = version || 1;
			return this;
		},

		stores: function (stores) {
			this._cfg.storeSource = stores;
			setApiOnPlace([this._db], keys(stores), this._db);
			return this;
		}
	}

	function Table(name) {
		this.name = name;
	}

	Table.prototype = {

		get: function (key) {
			var self = this;
			return new Dexie.Promise(function (resolve, reject) {
				resolve(self._getSync(key));
			});
		},

		_getSync: function (key) {
			var realKey = this._generateKey(key);
			var jsonStr = this._service().getItem(realKey);
			var result = JSON.parse(jsonStr);

			return result;
		},

		set: function (key, value) {
			var self = this;
			return new Dexie.Promise(function (resolve, reject) {

				var realKey = self._generateKey(key);
				if (typeof value === 'object') {
					value = JSON.stringify(value);
				}

				self._service().setItem(realKey, value);

				resolve();
			});
		},

		remove: function (key) {
			var self = this;
			return new Dexie.Promise(function (resolve, reject) {
				var realKey = self._generateKey(key);
				self._service().removeItem(realKey);
				resolve();
			});

		},

		count: function () {
			var self = this;
			return new Dexie.Promise(function (resolve, reject) {
				var exp = new RegExp("^" + self.name + "\\..+");
				var len = 0,
					service = self._service();

				//暂时遍历所有key
				for (var i = 0; i < service.getLength(); i++) {
					var keyName = service.key(i);
					if (!exp.test(keyName)) continue;
					len++;
				}

				resolve(len);
			});
		},

		gets: function () {
			var self = this;
			return new Dexie.Promise(function (resolve, reject) {
				var exp = new RegExp("^" + self.name + "\\..+");
				var arr = [],
					service = self._service();

				//暂时遍历所有key
				for (var i = 0; i < service.getLength(); i++) {
					var keyName = service.key(i);

					if (!exp.test(keyName)) continue;
					var item = self._getSync(keyName.substring(self.name.length + 1));
					arr.push(item);
				}

				resolve(arr);
			});

		},

		clear: function () {
			var self = this;
			return new Dexie.Promise(function (resolve, reject) {
				var exp = new RegExp("^" + self.name + "\\..+");
				var service = self._service();
				var keyNames = [];

				//暂时遍历所有key
				for (var i = 0, len = service.getLength(); i < len; i++) {
					var keyName = service.key(i);
					if (!exp.test(keyName)) continue;
					keyNames.push(keyName);
				}

				for (var i = 0; i < keyNames.length; i++) {
					service.removeItem(keyNames[i]);
				}

				resolve();
			});
		},

		_generateKey: function (primaryKey) {
			if (!primaryKey) throw "the primary key must by provided!";
			var prefix = this.name + "." + primaryKey;

			return prefix;
		},

		_service: function () {
			return plus.storage;
		}
	};

	//indexDb
	function IndexDb(name) {
		this.name = name;
		this._dexieDb = new Dexie(name);

		this._cfg = {
			storeSource: {},
			tables: [],
			version: 1
		};

		this.version = function (version) {
			this._cfg.version = version || 1;
			return this;
		}

		this._tableFactory = function createTable(name) {
			var table = new IndexDbTable(name, this);
			this._cfg.tables.push(table);
			return table;
		};

		this.stores = function (stores) {
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

		get: function (key) {
			return this._table.get(key);
		},

		set: function (key, value) {
			return this._table.put(value);
		},

		remove: function (key) {
			return this._table.delete(key);
		},

		count: function () {
			return this._table.count();
		},

		gets: function () {
			return this._table.toArray();
		},

		clear: function () {
			return this._table.clear();
		}
	};

	//LocalDB contains plus storeage and indexDB common operations
	function LocalTable(name, db) {
		this.name = name;
		this._db = db;
	}

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
	function Local(name, useIndexDb) {

		this._cfg = {
			storeSource: {},
			tables: [],
			version: 1
		};

		this.name = name;

		this.useIndexDb = useIndexDb;
		this._realDb = createRealDb(name, useIndexDb)

		this._tableFactory = function createTable(name) {
			var table = new LocalTable(name, this);
			this._cfg.tables.push(table);
			return table;
		};

		this.version = function (version) {
			this._cfg.version = version || 1;
			return this;
		}

		this.stores = function (stores) {
			this._cfg.storeSource = stores;
			var version = this._cfg.version || 1;
			this._realDb.version(version).stores(stores);
			setApiOnPlace([this._db], keys(stores), this._db);
			return this;
		};

		this._db = this;

		function createRealDb(name, useIndexDb) {
			if (useIndexDb) {
				return new IndexDb(name);
			}

			return new PlusStorageDb(name);
		}
	}

	return Local;
}))