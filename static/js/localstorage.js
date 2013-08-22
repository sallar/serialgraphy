/**
 * https://github.com/jc1arke/javascript-localstorage-wrapper
 */
var utils = utils || {};

utils.storage = {

  /**
   * Wrapper information
   */
  version: 1.0,
  author: 'JA Clarke',
  
  /**
   * The namespace for the keys (allows for multi-instances)
   */
  _namespace: '',
  
  /**
   * Debugging, obviously
   */
  _debug: false,

  /**
   * Storage variable indicating whether the storage engine is active or not
   * Default is off. Its better to have it stored as a variable, otherwise you will end up
   *  spamming the poor DOM Window engine with function requests everytime and could lead to poor
   *  memory handling
   */
  _enabled: false,
  
  /**
   * Fire up the beast!! :P
   */
  init: function(namespace, debug) {
    this._namespace = ( namespace || '' ) + '_';
    this._debug = debug || false;
    if( this.isSupported ) {
      this._enabled = true;
      // Hook onto and listen for storage engine events
      if(window.addEventListener){
        window.addEventListener('storage', this._events, false);
      }else{
        window.attachEvent('onstorage', this._events);
      }
    } // No need for else, as it has a default init value
  },
  
  
  /**
   * Check for compatibility 
   */
  isSupported: function(){
    try{
      if( 'localstorage' in window && window['localstorage'] !== null || 'localStorage' in window && window['localStorage'] !== null ) {
        return true;
      }
    }catch( e ){
      return false;
    }
  },
  
  /**
   * Used to check if a key exists
   */
  exists: function(key){
    var _t;
    if( ! this._enabled ) {
      if(this._debug) console.log('Engine not available');
      return false;
    }
    try{
      if(this._debug) { 
        console.log('Current namespace is %s', this._namespace);
        console.log('Checking if %s exists', this._namespace + key);
      }
      _t = this.read(key);
      if(this._debug) console.log('Type of key %s', typeof _t);
      if(_t != null && _t != false){
        if(this._debug) console.log('Key %s exists with the current value of %s', this._namespace + key, this.read(key));
        return true;
      }else{
        if(this._debug) console.log('Key %s doesn\'t exist', this._namespace + key);
        return false;
      }
    }catch(e){
      return false;
    }
  },
  
  /**
   * Create a element in the storage engine
   */
  save: function(key, value){
    if( ! this._enabled ){
      if(this._debug) console.log('Engine not available');
      return false;
    }
    try{
      if(this._debug) { 
        console.log('Current namespace is %s', this._namespace);
        console.log('Setting value for %s', this._namespace + key);
      }
      value = JSON.stringify(value); // Store items as JSON
      localStorage.setItem(this._namespace + key, value);
      return true;
    }catch( e ){
      return false;
    }
  },
  
  /**
   * Get a item from the storage engine
   */
  read: function(key){
    var _v;
    if( ! this._enabled ) {
      if(this._debug) console.log('Engine not available');
      return false;
    }
    try {
      _v = JSON.parse( localStorage.getItem(this._namespace + key) );
      if(this._debug) { 
        console.log('Current namespace is %s', this._namespace);
        console.log('Key being retrieved %s', this._namespace + key);
        console.log('The value of the key is %s', _v);
      }
      return _v;
    } catch( e ) {
      return false;
    }
  },
  
  /**
   * Remove a item from the storage engine
   */
  remove: function(key){
    if( ! this._enabled ) {
      if(this._debug) console.log('Engine not available');
      return false;
    }
    try{
      if(this._debug) { 
        console.log('Current namespace is %s', this._namespace);
        console.log('Key to remove %s', this._namespace + key);
      }
      localStorage.removeItem(this._namespace + key);
      return true;
    }catch(e){
      return false;
    }
  },
  
  /**
   * Clear the storage engine for this namespance ONLY
   * This is different to the default clear from HTML5 storage engines
   * The default clears everything, but since I am supporting multi-instances 
   *  and namespaces this is needed
   */
   clear: function(){
     var i, testKey;
     if( ! this._enabled ) {
       if(this._debug) console.log('Engine not available');
       return false;
     }
     try{
       for(i = 0; i < localStorage.length; i++){
         // Test if the current key is in the namespace
         testKey = localStorage.key(i).substring(0,this._namespace - 1);
         if(testKey == this._namespace){
           this.remove(testKey);
         }
       }
     }catch(e){
       return false;
     }
   },
   
   /**
    * The storage engine event handler
    * This only gets called when a modification on the storage engine was successful
    * The event data (e in this instance) will contain the following information:
    *  key : string : the named key that was added, removed, or modified
    *  oldValue : any : the previous value (now overwritten), or null if a new item was added
    *  newValue : any : the new value, or null if an item was removed
    *  url : string : the page which called a method that triggered this change
    */
   _events: function(e){
     // IE Fix since it stores the event data in window.event and doesn't pass it
     if(!e) { e = window.event; } 
     /** 
      * Some browsers shipped with the storageEvent class having a uri property instead of a url property
      *  as the specification was not yet finalized. Just need to filter for these for maximum compatibility
      */
     e.url = e.url || e.uri;
     
     if(this._debug){
       console.group('StorageEvent');
       console.log('key: ', e.key);
       console.log('oldValue: ', e.oldValue);
       console.log('newValue: ', e.newValue);
       console.log('url: ', e.url);
       console.groupEnd('StorageEvent');
     }
   }
};
