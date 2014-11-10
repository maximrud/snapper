(function($) {

    var items, cursor, item, next, point, finished = false, animated = false;

    function distance(pos1, pos2) {
        var x, y;
        return Math.round(Math.sqrt((y = pos1.top - pos2.top) * y + (x = pos1.left - pos2.left) * x));
    }

    function dropItem() {
        var snapper = item.parent().data('snapper'),
                snapped = false;
        snapper.stopDrag();
        $('.snapper').each(function() {
            if ($(this).data('snapper').make(snapper)) {
                snapped = true;
                return false;
            }
        });
        if (!snapped)
            snapper.drop();
        setTimeout(stepDemo, 2000);
    }

    function moveNext() {
        var snapper = item.parent().data('snapper'),
                offset = next.offset(),
                pos = {
            top: offset.top + next.outerHeight() / 2 + 15,
            left: offset.left + next.outerWidth() / 2
        },
        speed = 2 * distance(pos, cursor.offset());
        cursor.animate({
            top: pos.top,
            left: pos.left
        }, {
            duration: speed,
            easing: 'swing',
            step: function() {
                var offset = cursor.offset();
                snapper.moveDrag({pageX: offset.left, pageY: offset.top});
            },
            complete: dropItem
        });
    }

    function startDrag() {
        var offset = cursor.offset(),
                snapper = item.parent().data('snapper');
        setTimeout(function() {
            snapper.startDrag(item, {pageX: offset.left, pageY: offset.top});
            setTimeout(moveNext, 200);
        }, 300);
    }

    function moveToItem() {
        var offset = item.offset(),
                pos = {
            top: offset.top + item.outerHeight() / 2,
            left: offset.left + item.outerWidth() / 2
        },
        speed = 2 * distance(pos, cursor.offset());
        cursor.animate({
            top: pos.top,
            left: pos.left
        }, speed, 'swing', startDrag);
    }


    function stepDemo() {
        if (finished) {
            cursor.hide();
            animated = false;
            return;
        }
        var test;
        item = undefined;
        while (!item) {
            test = $('#item' + Math.floor(Math.random() * items.length));
            if (test.parent().find('.item').length > 1)
                item = test;
        }
        next = undefined;
        while (!next) {
            test = $('#item' + Math.floor(Math.random() * items.length));
            if (test[0] !== item[0])
                next = test;
        }
        moveToItem();
    }

    function stopDemo() {
        finished = true;
    }

    function startDemo() {
        $(document.body).css({
            cursor: 'none'
        });
        finished = false;
        if (!animated) {
            if (point)
                cursor.css({
                    top: point.pageY,
                    left: point.pageX
                });
            cursor.show();
            animated = true;
            stepDemo();
        }
    }

    $(function() {

        cursor = $('#cursor');
        items = $('#presentation').find('.item');
        items.each(function() {
            while (!this.id) {
                var id = 'item' + Math.floor(Math.random() * items.length);
                if ($('#' + id).length === 0)
                    this.id = id;
            }
        });
        $('.item-container').snapper();
        var startTimer = setTimeout(startDemo, 3000);
        $(document).on('mousedown mouseup mousemove touchstart touchmove touchend', function(event) {
            if (!event.originalEvent.touches)
                point = event;
            stopDemo();
            if (startTimer)
                clearTimeout(startTimer);
            startTimer = setTimeout(startDemo, 3000);
            $(document.body).css({
                cursor: 'default'
            });
        });
    });

})(jQuery);

