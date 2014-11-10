(function($) {

    if (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) {
        var pointerEvents = 'cancel down enter hover leave move out over up'.split(' ');
        $.each(pointerEvents, function(i, name) {
            var orig = 'mouse' + name, fix;
            if (window.navigator.pointerEnabled)
                fix = 'pointer' + name;
            else
                fix = 'MSPointer' + name.substring(0, 1).toUpperCase() + name.substring(1);
            $.event.special[orig] = {
                delegateType: fix,
                bindType: fix,
                handle: function(event) {
                    var ret, handleObj = event.handleObj;
                    event.type = handleObj.origType;
                    ret = handleObj.handler.apply(this, arguments);
                    event.type = fix;
                    return ret;
                }
            };
            $.event.fixHooks[fix] = $.event.mouseHooks;
        });
    }

})(jQuery);


