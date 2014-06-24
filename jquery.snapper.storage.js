(function($) {

    var storage = window.localStorage;
    if (storage) {

        function identifier(prefix) {
            var seq = 0;
            return function() {
                return this.id || (this.id = (prefix || '') + seq++);
            };
        }

        $(document).on('done.snapper  snap.snapper', '.snapper', function(event) {
            var self = $(event.target), list = '';
            self.children().each(function() {
                list = list === '' ? this.id : list + ' ' + this.id;
            });
            storage.setItem('snapper[' + event.target.id + ']', list);
        });

        $(function() {
            $(document).off('.snapper.data-api');
            var func = identifier('_sn_'), lists = [];
            $('[data-toggle="snapper"]').snapper().each(function() {
                func.call(this);
                $(this).children().each(identifier(this.id + '_'));
            }).each(function(i) {
                var self = $(this),
                        list = storage.getItem('snapper[' + this.id + ']');
                if (list !== undefined && list !== null) {
                    lists[i] = list = list.split(' ');
                    $(list).each(function(i, value) {
                        if (value.length > 0)
                            $('#' + value).appendTo(self);
                    });
                }
            }).each(function(i) {
                var list = lists[i];
                if (list !== undefined) {
                    $(this).children().each(function() {
                        if ($.inArray(this.id, list) < 0)
                            $(this).remove();
                    });
                }
            });
        });


    }

})(jQuery);

