(function($) {

    var timer, div = $('<div>'), animated, 
        speed = 400, timeout = 400;

    $.easing['ease-in'] = function(x, t, b, c, d) {
        return c * (t /= d) * t + b;
    };

    function scrollLeft(pos) {
        var win = $(window),
                left = win.scrollLeft();
        if (pos === undefined)
            return left;
        else if (left !== pos) {
            animated = true;
            div.stop().css('top', left).animate({
                top: pos
            }, {
                duration: speed,
                easing: 'ease-in',
                step: function(now) {
                    win.scrollLeft(now);
                },
                complete: function() {
                    animated = false;
                }
            });
        }
    }

    function marginLeft() {
        return parseInt($('.document').css('margin-left'));
    }

    function hide() {
        scrollLeft(marginLeft());
    }

    function show() {
        scrollLeft(0);
    }

    function stick() {
        if (scrollLeft() - marginLeft() / 2 > 0)
            hide();
        else
            show();
    }

    $(window).on('load resize', hide);

    $('a').on('touchstart', function() {
        $('.sidebar').focus();
    });

    $('a').click(function() {
        setTimeout(hide, timeout);
    });

    $(window).on('scroll', function() {
        if (timer)
            clearTimeout(timer);
        var left = scrollLeft();
        if (left !== marginLeft() && left !== 0 && !animated)
            timer = setTimeout(stick, timeout);
    });

})(jQuery);
