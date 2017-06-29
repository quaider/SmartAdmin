(function(mui) {

	mui.plusReady(function() {

		var _myStorage = {
			type: 'plus', //plus||indexDB
		};

		function getService() {
			if(_myStorage.type === 'plus') return plus.storage;

			var db = new Dexie("MyDatabase");
			db.version(1).stores({
				friends: "key,value",
			});

			db.open().catch(function(e) {
				console.error("Open failed: " + e.stack);
			});

			return db;
		}

		var srv = getService();

		_myStorage.getItem = function(key) {

			return new Dexie.Promise(function(resolve, reject) {

				if(_myStorage.type === 'plus') {
					resolve(srv.getItem(key));
				} else {
					srv.friends.get(key, function(item) {
						if(item == null || item == undefined) return null;
						resolve(item.value);
					});
				}

			});

		};

		_myStorage.setItem = function(key, value) {

			if(_myStorage.type === 'plus') {
				return srv.setItem(key, value);
			}

			srv.friends.put({
				key: key,
				value: typeof value === 'object' ? JSON.stringify(value) : value
			})

		};

		_myStorage.getLength = function() {

			return new Dexie.Promise(function(resolve, reject) {

				if(_myStorage.type === 'plus') {
					resolve(srv.getLength());
				} else {
					srv.friends.count().then(function(cnt) {
						resolve(cnt);
					});
				}

			});

		};

		_myStorage.removeItem = function(key) {
			if(_myStorage.type === 'plus') {
				srv.removeItem(key);
			} else {
				srv.friends.delete(key);
			}
		};

		_myStorage.clear = function() {
			if(_myStorage.type === 'plus') {
				srv.clear();
			} else {
				srv.friends.clear();
			}
		};

		/** 
		 * @description 获取所有存储对象 
		 * @param {Object} key 可选，不传参则返回所有对象，否则返回含有该key的对象 
		 */
		_myStorage.getItems = function(key) {

		};

		window.myStorage = _myStorage;

	});

}(mui));