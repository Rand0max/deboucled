/*!
    LocalForage TTL - Version simplifiée avec support TTL
    Basé sur localForage avec fonctionnalités TTL intégrées
*/
(function() {
    'use strict';

    // Configuration par défaut
    var config = {
        name: 'localforage',
        defaultTTL: null,
        cleanupInterval: 5 * 60 * 1000, // 5 minutes
        metaPrefix: '__TTL__'
    };

    var cleanupTimer = null;

    // Utilitaires TTL
    function createMetadata(ttl) {
        var now = Date.now();
        return {
            createdAt: now,
            expiresAt: ttl ? now + ttl : null
        };
    }

    function isExpired(metadata) {
        return metadata && metadata.expiresAt && Date.now() > metadata.expiresAt;
    }

    function getMetaKey(key) {
        return config.metaPrefix + key;
    }

    function getStorageKey(key) {
        return config.name + '/' + key;
    }

    // Promise simple pour compatibilité
    function SimplePromise(executor) {
        var self = this;
        self.state = 'pending';
        self.value = undefined;
        self.handlers = [];

        function resolve(result) {
            if (self.state === 'pending') {
                self.state = 'resolved';
                self.value = result;
                self.handlers.forEach(function(handler) {
                    handler.onResolve(result);
                });
                self.handlers = [];
            }
        }

        function reject(error) {
            if (self.state === 'pending') {
                self.state = 'rejected';
                self.value = error;
                self.handlers.forEach(function(handler) {
                    handler.onReject(error);
                });
                self.handlers = [];
            }
        }

        this.then = function(onResolve, onReject) {
            return new SimplePromise(function(res, rej) {
                function handle() {
                    if (self.state === 'resolved') {
                        try {
                            if (typeof onResolve === 'function') {
                                res(onResolve(self.value));
                            } else {
                                res(self.value);
                            }
                        } catch (ex) {
                            rej(ex);
                        }
                    } else if (self.state === 'rejected') {
                        try {
                            if (typeof onReject === 'function') {
                                res(onReject(self.value));
                            } else {
                                rej(self.value);
                            }
                        } catch (ex) {
                            rej(ex);
                        }
                    } else {
                        self.handlers.push({
                            onResolve: function(result) {
                                try {
                                    if (typeof onResolve === 'function') {
                                        res(onResolve(result));
                                    } else {
                                        res(result);
                                    }
                                } catch (ex) {
                                    rej(ex);
                                }
                            },
                            onReject: function(error) {
                                try {
                                    if (typeof onReject === 'function') {
                                        res(onReject(error));
                                    } else {
                                        rej(error);
                                    }
                                } catch (ex) {
                                    rej(ex);
                                }
                            }
                        });
                    }
                }
                handle();
            });
        };

        this.catch = function(onReject) {
            return this.then(null, onReject);
        };

        try {
            executor(resolve, reject);
        } catch (ex) {
            reject(ex);
        }
    }

    // Constructeur principal
    function LocalForageTTL() {
        this._ready = true;
        startCleanupTimer();
    }

    // Méthodes principales
    LocalForageTTL.prototype.getItem = function(key, callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var storageKey = getStorageKey(key);
                var metaKey = getStorageKey(getMetaKey(key));
                
                var value = localStorage.getItem(storageKey);
                var metaData = localStorage.getItem(metaKey);
                
                if (value === null) {
                    resolve(null);
                    return;
                }

                // Vérifier TTL
                if (metaData) {
                    try {
                        var meta = JSON.parse(metaData);
                        if (isExpired(meta)) {
                            localStorage.removeItem(storageKey);
                            localStorage.removeItem(metaKey);
                            resolve(null);
                            return;
                        }
                    } catch (e) { // eslint-disable-line no-unused-vars
                        // Métadonnées corrompues, continuer
                    }
                }

                try {
                    resolve(JSON.parse(value));
                } catch (ex) { // eslint-disable-line no-unused-vars
                    resolve(value);
                }
            } catch (error) {
                reject(error);
            }
        }).then(function(result) {
            if (callback) callback(null, result);
            return result;
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.setItem = function(key, value, callback, ttl) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var storageKey = getStorageKey(key);
                var metaKey = getStorageKey(getMetaKey(key));
                
                var serializedValue = JSON.stringify(value);
                localStorage.setItem(storageKey, serializedValue);

                var effectiveTTL = ttl !== undefined ? ttl : config.defaultTTL;
                if (effectiveTTL) {
                    var metadata = createMetadata(effectiveTTL);
                    localStorage.setItem(metaKey, JSON.stringify(metadata));
                } else {
                    localStorage.removeItem(metaKey);
                }

                resolve(value);
            } catch (error) {
                reject(error);
            }
        }).then(function(result) {
            if (callback) callback(null, result);
            return result;
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.setItemWithTTL = function(key, value, ttl, callback) {
        return this.setItem(key, value, callback, ttl);
    };

    LocalForageTTL.prototype.removeItem = function(key, callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var storageKey = getStorageKey(key);
                var metaKey = getStorageKey(getMetaKey(key));
                
                localStorage.removeItem(storageKey);
                localStorage.removeItem(metaKey);
                
                resolve();
            } catch (error) {
                reject(error);
            }
        }).then(function() {
            if (callback) callback(null);
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.clear = function(callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var prefix = config.name + '/';
                var keysToRemove = [];

                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf(prefix) === 0) {
                        keysToRemove.push(key);
                    }
                }

                keysToRemove.forEach(function(key) {
                    localStorage.removeItem(key);
                });

                resolve();
            } catch (error) {
                reject(error);
            }
        }).then(function() {
            if (callback) callback(null);
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.length = function(callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var prefix = config.name + '/';
                var metaPrefix = config.metaPrefix;
                var count = 0;

                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf(prefix) === 0 && key.indexOf(metaPrefix) === -1) {
                        count++;
                    }
                }

                resolve(count);
            } catch (error) {
                reject(error);
            }
        }).then(function(result) {
            if (callback) callback(null, result);
            return result;
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.key = function(n, callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var prefix = config.name + '/';
                var prefixLength = prefix.length;
                var metaPrefix = config.metaPrefix;
                var keys = [];

                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf(prefix) === 0 && key.indexOf(metaPrefix) === -1) {
                        keys.push(key.substring(prefixLength));
                    }
                }

                var result = (n >= 0 && n < keys.length) ? keys[n] : null;
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }).then(function(result) {
            if (callback) callback(null, result);
            return result;
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.keys = function(callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var prefix = config.name + '/';
                var prefixLength = prefix.length;
                var metaPrefix = config.metaPrefix;
                var keys = [];

                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf(prefix) === 0 && key.indexOf(metaPrefix) === -1) {
                        keys.push(key.substring(prefixLength));
                    }
                }

                resolve(keys);
            } catch (error) {
                reject(error);
            }
        }).then(function(result) {
            if (callback) callback(null, result);
            return result;
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    // Méthodes TTL spécifiques
    LocalForageTTL.prototype.getTTL = function(key, callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var metaKey = getStorageKey(getMetaKey(key));
                var metaData = localStorage.getItem(metaKey);
                
                if (!metaData) {
                    resolve(null);
                    return;
                }

                var meta = JSON.parse(metaData);
                var remaining = meta.expiresAt ? meta.expiresAt - Date.now() : null;
                resolve(remaining);
            } catch (error) {
                reject(error);
            }
        }).then(function(result) {
            if (callback) callback(null, result);
            return result;
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.updateTTL = function(key, newTTL, callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var storageKey = getStorageKey(key);
                var metaKey = getStorageKey(getMetaKey(key));
                
                if (localStorage.getItem(storageKey) === null) {
                    resolve(false);
                    return;
                }

                if (newTTL) {
                    var metadata = createMetadata(newTTL);
                    localStorage.setItem(metaKey, JSON.stringify(metadata));
                } else {
                    localStorage.removeItem(metaKey);
                }

                resolve(true);
            } catch (error) {
                reject(error);
            }
        }).then(function(result) {
            if (callback) callback(null, result);
            return result;
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.cleanup = function(callback) {
        return new SimplePromise(function(resolve, reject) {
            try {
                var prefix = config.name + '/';
                var metaPrefix = config.metaPrefix;
                var expiredKeys = [];
                var cleanedCount = 0;

                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf(prefix) === 0 && key.indexOf(metaPrefix) !== -1) {
                        try {
                            var metaData = localStorage.getItem(key);
                            var meta = JSON.parse(metaData);
                            if (isExpired(meta)) {
                                var originalKey = key.replace(prefix + metaPrefix, prefix);
                                expiredKeys.push({
                                    dataKey: originalKey,
                                    metaKey: key
                                });
                            }
                        } catch (e) { // eslint-disable-line no-unused-vars
                            expiredKeys.push({
                                dataKey: key.replace(metaPrefix, ''),
                                metaKey: key
                            });
                        }
                    }
                }

                expiredKeys.forEach(function(keyPair) {
                    localStorage.removeItem(keyPair.dataKey);
                    localStorage.removeItem(keyPair.metaKey);
                    cleanedCount++;
                });

                resolve(cleanedCount);
            } catch (error) {
                reject(error);
            }
        }).then(function(result) {
            if (callback) callback(null, result);
            return result;
        }).catch(function(error) {
            if (callback) callback(error);
            throw error;
        });
    };

    LocalForageTTL.prototype.config = function(options) {
        if (typeof options === 'object') {
            for (var key in options) {
                if (Object.prototype.hasOwnProperty.call(options, key)) {
                    config[key] = options[key];
                }
            }
            return true;
        } else if (typeof options === 'string') {
            return config[options];
        } else {
            return config;
        }
    };

    LocalForageTTL.prototype.createInstance = function(options) {
        var instance = new LocalForageTTL();
        if (options) {
            instance.config(options);
        }
        return instance;
    };

    // Timer de nettoyage
    function startCleanupTimer() {
        if (cleanupTimer || !config.cleanupInterval) return;

        cleanupTimer = setInterval(function() {
            if (typeof window !== 'undefined' && window.localforage) {
                window.localforage.cleanup().catch(function() {
                    // Ignorer les erreurs
                });
            }
        }, config.cleanupInterval);
    }

    function stopCleanupTimer() {
        if (cleanupTimer) {
            clearInterval(cleanupTimer);
            cleanupTimer = null;
        }
    }

    // Instance par défaut
    var localforage = new LocalForageTTL();

    // Nettoyage à la fermeture
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', stopCleanupTimer);
        window.localforage = localforage;
    }

    // Export pour Node.js si disponible
    try {
        // eslint-disable-next-line no-undef
        if (typeof module !== 'undefined' && module.exports) {
            // eslint-disable-next-line no-undef
            module.exports = localforage;
        }
    } catch (e) { // eslint-disable-line no-unused-vars
        // Ignore les erreurs d'environnement
    }

    return localforage;
})();