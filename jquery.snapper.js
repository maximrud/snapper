(function($) {

    $.easing['ease-out'] = $.easing.easeOutQuad || function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    };

    function animate(self, properties, duration, easing, callback) {
        if ($.support.transition && self.transit)
            self.transit(properties, duration, easing, callback);
        else
            self.animate(properties, duration, easing, callback);
    }

    function distance(pos1, pos2) {
        var x, y;
        return Math.round(Math.sqrt((y = pos1.top - pos2.top) * y + (x = pos1.left - pos2.left) * x));
    }

    function setcss(self, styles, savepoint) {
        var saveStyle = {}, el = self[0];
        $.each(styles, function(name) {
            saveStyle[name] = el.style[name];
            if (name === 'opacity')
                saveStyle['filter'] = el.style['filter'];
        });
        self.data('_savedstyle_' + savepoint, saveStyle);
        self.css(styles);
    }

    function resetcss(self, savepoint) {
        savepoint = '_savedstyle_' + savepoint;
        var saveStyle = self.data(savepoint);
        if (saveStyle) {
            var el = self[0];
            $.each(saveStyle, function(name, value) {
                try {
                    el.style[name] = value;
                    if (value === undefined || value === null || value === '')
                        delete el.style[name];
                } catch (e) {
                }
            });
            self.removeData(savepoint);
        }
    }

    function unfix(self) {
        var items = self.children();
        items.each(function() {
            resetcss($(this), 'fix');
        });
        resetcss(self, 'fix');
    }

    function fix(self) {
        var items = self.children();
        setcss(self, {height: self.css('height'), width: self.css('width')}, 'fix');
        var styles = [];
        items.each(function(i) {
            var item = $(this), pos = item.position();
            styles[i] = {position: 'absolute', top: pos.top, left: pos.left,
                height: item.css('height'), width: item.css('width')};
        });
        items.each(function(i) {
            setcss($(this), styles[i], 'fix');
        });
    }

    function wrapper(callback, context) {
        return callback && function() {
            callback.call(context);
        };
    }

    function fromMS(s) {
        var value = parseInt(s),
                unit = s.substring(('' + value).length);
        if (unit === 'm' || unit === 'min')
            return value * 60000;
        if (unit === 's' || unit === 'sec')
            return value * 1000;
        else
            return value;
    }

    function duration(self, offset, speed) {
        speed = fromMS(speed);
        return Math.max(distance(self.offset(), offset) * speed / 200, speed || 200);
    }

    function sizing(self, offset) {
        offset.width = self.css('width');
        offset.height = self.css('height');
        return offset;
    }

    function bounds(self) {
        var result = [];
        self.children().each(function() {
            var item = $(this);
            result.push(sizing(item, item.position()));
        });
        result.push(sizing(self, {}));
        return result;
    }

    function place(self, item, index) {
        var items = self.children();
        if (index < items.length)
            item.insertBefore(items[index]);
        else
            item.appendTo(self);
    }

    function move(self, offset, speed, easing, callback, context) {
        animate(self, offset, speed, easing, wrapper(callback, context));
    }

    function resize(self, bounds, speed, easing) {
        var items = self.children();
        animate(self, bounds[items.length], speed, easing);
        items.each(function(index) {
            animate($(this), bounds[index], speed, easing);
        });
    }

    function center(self, offset) {
        offset = offset || self.offset();
        return {
            top: offset.top + Math.round(self.innerHeight() / 2),
            left: offset.left + Math.round(self.innerWidth() / 2)
        };
    }

    var snapperState = 'idle', holdTimeout, stopTimeout, lastEvent;

    function removeSelection() {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        else if (document.selection && document.selection.clear)
            document.selection.clear();
    }

    function ondone() {
        $(this).off('done.snapper', ondone);
        snapperState = 'idle';
    }

    function ondrop(event) {
        var self = $(this),
                snapper = self.data('snapper');
        self.off('drop.snapper', ondrop);
        self.on('done.snapper', ondone);
        snapperState = 'snap';
        $('.snapper').each(function() {
            if ($(this).data('snapper').make(snapper)) {
                event.preventDefault();
                return false;
            }
        });
        if (!event.isDefaultPrevented())
            snapper.drop();
    }

    function onhold(event) {
        var item = $(this),
                snapper = event.data,
                touches = event.originalEvent.touches;
        if (snapperState === 'hold') {
            if ((document.body.style['-ms-touch-action'] !== undefined) && (
                    event.originalEvent.pointerType === 2 ||
                    event.originalEvent.pointerType === 3 ||
                    event.originalEvent.pointerType === 'touch' ||
                    event.originalEvent.pointerType === 'pen')) {
                snapperState = 'next';
                setcss($(document.body), {'-ms-touch-action': 'none'}, 'mstouch');
            } else {
                snapperState = 'drag';
            }
            snapper.startDrag(item, touches ? touches[0] : event);
            stopTimeout = setTimeout(function() {
                onstop(event);
            }, fromMS(snapper.timeout));
        } else {
            unbind(touches);
            snapperState = 'idle';
        }
    }

    function onmove(event) {
        var touches = event.originalEvent.touches,
                snapper = event.data;
        if (snapperState === 'drag') {
            snapper.moveDrag(touches ? touches[0] : event);
            removeSelection();
            clearTimeout(stopTimeout);
            stopTimeout = setTimeout(function() {
                onstop(event);
            }, fromMS(snapper.timeout));
            event.preventDefault();
            event.stopPropagation();
        } else if (snapperState === 'hold') {
            if (touches || event.pageX !== lastEvent.pageX ||
                    event.pageY !== lastEvent.pageY) {
                snapperState = 'idle';
                clearTimeout(holdTimeout);
                unbind(touches);
            }
        }
    }

    function onstop(event) {
        var touches = event.originalEvent.touches;
        if (snapperState === 'next') {
            snapperState = 'drag';
        } else {
            unbind(touches);
            if (snapperState === 'drag') {
                var snapper = event.data;
                if (!touches)
                    snapper.moveDrag(event);
                clearTimeout(stopTimeout);
                snapperState = 'drop';
                $(snapper.self).on('drop.snapper', ondrop);
                snapper.stopDrag();
                resetcss($(document.body), 'mstouch');
            } else if (snapperState === 'hold') {
                snapperState = 'idle';
                clearTimeout(holdTimeout);
            } else
                snapperState = 'idle';
        }
    }

    function onstart(event) {
        if (snapperState === 'idle') {
            var item = $(this),
                    snapper = event.data = item.parent().data('snapper'),
                    touches = event.originalEvent.touches;
            snapperState = 'hold';
            holdTimeout = setTimeout(function() {
                onhold.call(item[0], event);
            }, fromMS(snapper.taphold));
            lastEvent = event;
            bind(touches, snapper);
        }
    }

    function bind(touches, data) {
        if (touches) {
            $(document).on('touchmove.snapper', data, onmove);
            $(document).on('touchend.snapper touchcancel.snapper', data, onstop);
        } else {
            $(document).on('mousemove.snapper', data, onmove);
            $(document).on('mouseup.snapper', data, onstop);
        }
    }

    function unbind(touches) {
        if (touches) {
            $(document).off('touchmove.snapper', onmove);
            $(document).off('touchend.snapper touchcancel.snapper', onstop);
        } else {
            $(document).off('mousemove.snapper', onmove);
            $(document).off('mouseup.snapper', onstop);
        }
    }

    function Snapper(self, options) {
        var snapper = this;
        snapper.self = self;
        options = options || {};
        $.each(options, function(name, value) {
            name = $.camelCase(name);
            if (Snapper.prototype.hasOwnProperty(name)) {
                snapper[name] = value;
            }
        });
        self.addClass('snapper');
        var items = self.children();
        if (!options['data-api'])
            items.on('mousedown.snapper touchstart.snapper', onstart);
    }

    $.snapper = Snapper.prototype;

    $.extend(Snapper.prototype, {
        inertia: '200ms',
        speed: '200ms',
        taphold: '200ms',
        timeout: '2s',
        easing: 'ease-out',
        'catch': 'none',
        out: 'remove',
        state: function() {
            return snapperState;
        },
        startDrag: function(item, point) {
            this.item = item;
            var offset = this.offset = item.offset();
            this.twin = item.clone().appendTo(document.body).css({
                position: 'absolute',
                top: offset.top,
                left: offset.left,
                width: item.css('width'),
                height: item.css('height'),
                margin: 0
            });
            setcss(item, {
                opacity: 0,
                zoom: 'normal'
            }, 'item');
            point = {pageX: point.pageX, pageY: point.pageY,
                time: (new Date()).getTime()};
            this.point = point;
            this.from = this.self.children().index(item);
            this.moves = [point];
            this.self.trigger({type: 'drag.snapper', data: this});
        },
        moveDrag: function(point) {
            if (this.point.pageX !== point.pageX || this.point.pageY !== point.pageY) {
                point = {pageX: point.pageX, pageY: point.pageY,
                    time: (new Date()).getTime()};
                var offset = {
                    top: this.offset.top + point.pageY - this.point.pageY,
                    left: this.offset.left + point.pageX - this.point.pageX
                };
                this.twin.css(offset);
                while (this.moves.length > 4)
                    this.moves.shift();
                this.moves.push(point);
            }
        },
        stopDrag: function() {
            var offset = this.twin.offset(),
                    begin = this.moves[0],
                    end = this.moves[this.moves.length - 1],
                    time = end.time - begin.time,
                    inertia = fromMS(this.inertia);
            var shift = {
                pageX: (time > 0 ? (end.pageX - begin.pageX) / time : 0) * inertia,
                pageY: (time > 0 ? (end.pageY - begin.pageY) / time : 0) * inertia
            };
            this.prediction = {
                top: offset.top + shift.pageY,
                left: offset.left + shift.pageX
            };
            this.self.trigger({type: 'drop.snapper', data: this});
        },
        isCatch: function(direction) {
            var s = this['catch'];
            return s && s.indexOf(direction) >= 0;
        },
        fitIn: function(pos) {
            var self = this.self,
                    offset = self.offset(),
                    marginTop = parseInt(self.css('marginTop')),
                    marginLeft = parseInt(self.css('marginLeft')),
                    top = pos.top - offset.top + marginTop,
                    left = pos.left - offset.left + marginLeft;
            return ((0 <= top || this.isCatch('top')) &&
                    (top < self.outerHeight(true) || this.isCatch('bottom')) &&
                    (0 <= left || this.isCatch('left')) &&
                    (left < self.outerWidth(true) || this.isCatch('right')));
        },
        toIndex: function(pos) {
            var self = this.self,
                    items = self.children(),
                    dist = -1, result = 0,
                    width = self.width();
            items.each(function(index) {
                var item = $(this), offset = center(item),
                        test = distance(pos, offset);
                if (dist < 0 || test < dist) {
                    dist = test;
                    result = index;
                    var inline = width !== item.outerWidth(true);
                    if ((inline && pos.left > offset.left)
                            || (!inline && pos.top > offset.top))
                        result++;
                }
            });
            return result;
        },
        make: function(source) {
            var pos = center(source.item, source.prediction);
            if (this.fitIn(pos)) {
                var dest = this,
                        to = dest.toIndex(pos),
                        from = source.from;
                if (dest === source) {
                    if (to === from)
                        source.cancel();
                    else {
                        source.to = to;
                        source.shift();
                    }
                } else if (source.out === 'cancel' || dest.out === 'cancel') {
                    source.cancel();
                } else {
                    source.to = to;
                    source.dest = dest;
                    if (source.out === 'swap' || dest.out === 'swap')
                        source.swap();
                    else
                        source.transfer();
                }
                return true;
            }
        },
        shift: function() {
            var item = this.item,
                    from = this.from, to = this.to;
            place(this.self, item, to);
            var coords = bounds(this.self),
                    offset = sizing(item, item.offset()),
                    speed = duration(this.twin, offset, this.speed);
            place(this.self, item, from > to ? from + 1 : from);
            fix(this.self);
            place(this.self, item, to);
            resize(this.self, coords, speed, this.easing);
            move(this.twin, offset, speed, this.easing, function() {
                unfix(this.self);
                this.done();
            }, this);
        },
        transfer: function() {
            var source = this, dest = this.dest, item = this.item,
                    from = this.from, to = this.to;
            place(dest.self, item, to);
            var coords = bounds(dest.self),
                    _coords = bounds(source.self),
                    offset = sizing(item, item.offset()),
                    speed = duration(source.twin, offset, source.speed);
            place(source.self, item, from);
            fix(source.self);
            fix(dest.self);
            place(dest.self, item, to);
            resize(dest.self, coords, speed, this.easing);
            resize(source.self, _coords, speed, this.easing);
            move(source.twin, offset, speed, source.easing, function() {
                dest.self.trigger({type: 'snap.snapper', data: dest});
                unfix(dest.self);
                unfix(source.self);
                source.done();
            }, source);
        },
        swap: function() {
            var source = this, dest = this.dest, item = this.item,
                    from = this.from, to = this.to,
                    items = dest.self.children(),
                    _item = $(to < items.length ? items[to] : items[items.length - 1]);
            place(dest.self, item, to);
            place(source.self, _item, from);
            var coords = bounds(dest.self),
                    _coords = bounds(source.self),
                    offset = sizing(item, item.offset()),
                    _offset = sizing(_item, _item.offset()),
                    speed = duration(source.twin, offset, source.speed);
            place(source.self, item, from);
            place(dest.self, _item, to);
            var _twin = _item.clone().appendTo(document.body).css({
                position: 'absolute',
                top: _item.offset().top,
                left: _item.offset().left,
                width: _item.css('width'),
                height: _item.css('height'),
                margin: 0
            });
            setcss(_item, {
                opacity: 0,
                zoom: 'normal'
            }, 'item');
            fix(source.self);
            fix(dest.self);
            place(dest.self, item, to);
            place(source.self, _item, from);
            resize(dest.self, coords, speed, this.easing);
            resize(source.self, _coords, speed, this.easing);
            move(_twin, _offset, speed, source.easing);
            move(source.twin, offset, speed, source.easing, function() {
                dest.self.trigger({type: 'snap.snapper', data: dest});
                _twin.remove();
                unfix(dest.self);
                unfix(source.self);
                resetcss(_item, 'item');
                source.done();
            }, source);
        },
        cancel: function() {
            var offset = this.twin.offset();
            if (offset.top === this.offset.top && offset.left === this.offset.left) {
                this.done();
            } else {
                var speed = duration(this.twin, this.offset, this.speed);
                move(this.twin, this.offset, speed, this.easing, this.done, this);
            }
        },
        drop: function() {
            if (this.out === 'swap') {
                this.dest = this;
                this.to = this.self.children().length;
                this.shift();
            } else if (this.out === 'cancel')
                this.cancel();
            else
                this.remove();
        },
        remove: function() {
            var self = this.self,
                    item = this.item,
                    speed = duration(this.twin, this.prediction, this.speed);
            item.remove();
            var coords = bounds(self);
            place(self, item, this.from);
            fix(self);
            item.remove();
            resize(self, coords, speed, this.easing);
            move(this.twin, $.extend({}, this.prediction, {opacity: 0}), speed,
                    this.easing, function() {
                        unfix(self);
                        this.done();
                    }, this);
        },
        done: function() {
            this.self.trigger({type: 'done.snapper', data: this});
            this.twin.remove();
            delete this.twin;
            resetcss(this.item, 'item');
            delete this.item;
            delete this.point;
            delete this.moves;
            delete this.offset;
            delete this.prediction;
            delete this.dest;
            delete this.from;
            delete this.to;
        }
    });

    $.fn.snapper = function(options) {
        return this.each(function() {
            var self = $(this);
            if (!self.data('snapper')) {
                self.data('snapper', new Snapper(self, $.extend({}, self.data(), options)));
            }
        });
    };

    $(document).on('mousedown.snapper.data-api touchstart.snapper.data-api',
            '[data-toggle="snapper"] > *', function() {
                $('[data-toggle="snapper"]').snapper({'data-api': true});
                onstart.apply(this, arguments);
            });

})(jQuery);

