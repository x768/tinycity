'use strict';

function Popup(view)
{
    const window_back = document.getElementById('popup-window-back');
    const title = document.getElementById('popup-title');
    const list_box = document.getElementById('popup-list');
    const svg_box = document.getElementById('popup-svg-wrapper');
    const svg = document.getElementById('popup-svg');
    const canvas_box = document.getElementById('popup-canvas-wrapper');
    const canvas = document.getElementById('popup-canvas');
    const file_drop = document.getElementById('popup-file-drop');

    let type = null;
    let callback_click = null;
    let callback_close = null;
    let is_title_logo = false;
    let command_ok = null;
    let command_cancel = null;
    let suppress_event = false;

    this.select_gift_cursor = -1;
    this.is_window_open = false;
    this.svg_list_values = null;
    this.callback_readfile = null;
    this.color_scheme = false;

    function number_format(num, width) {
        num = Math.round(num);
        let digit = 1;
        for (let i = 0; i < width; i++) {
            digit *= 10;
        }
        let decimal = resource.gettext('decimal');
        if (num >= 0) {
            return Math.floor(num / digit) + decimal + ("000000" + (num % digit)).substr(-width);
        } else {
            num = -num;
            return "-" + Math.floor(num / digit) + decimal + ("000000" + (num % digit)).substr(-width);
        }
    }
    function number_format_incdec(num) {
        if (num > 0) {
            return "+" + num;
        } else if (num < 0) {
            return String(num);
        } else {
            return "±0";
        }
    }
    function new_svg_node(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    function event_cancel(e) {
        e.stopPropagation();
    }

    this.get_canvas = function() {
        return canvas;
    };

    function draw_gift_cursor(self) {
        if (self.select_gift_cursor >= 0) {
            let ctx = canvas.getContext('2d');
            for (let i = 0; i < 2; i++) {
                let x = 40 + 62 + 130 * i;
                if (i === self.select_gift_cursor) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.moveTo(x, 338 - 20 - 8);
                    ctx.lineTo(x - 8, 338 - 20 + 8);
                    ctx.lineTo(x + 8, 338 - 20 + 8);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.rect(x - 8, 338 - 20 - 8, 16, 16);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    }

    this.open = function(cb_click, cb_close) {
        callback_click = cb_click;
        callback_close = cb_close;
        window_back.style.display = 'flex';
        list_box.scrollTop = 0;
        this.is_window_open = true;
        draw_gift_cursor(this);
    };
    this.open_delay = function(cb_click, cb_close) {
        let popup_window = document.getElementById('popup-window');
        callback_click = cb_click;
        callback_close = cb_close;
        window_back.style.display = 'flex';
        popup_window.style.display = 'none';
        list_box.scrollTop = 0;
        this.is_window_open = true;
        draw_gift_cursor(this);
        suppress_event = true;
        window.setTimeout(() => {
            popup_window.style.display = '';
            suppress_event = false;
        }, 500);
    };
    this.close = function() {
        window_back.style.display = 'none';
        this.is_window_open = false;
        this.svg_list_values = null;
    };
    this.quit_mode = function(msg) {
        window_back.style.display = 'block';
        window_back.style.background = '';
        document.getElementById('popup-window').style.display = 'none';
        document.getElementById('message-ticker').style.display = 'block';
        document.getElementById('message-ticker-content').textContent = resource.gettext(msg);

        this.is_window_open = true;
        callback_click = null;
        callback_close = null;
    };
    this.reset = function() {
        document.getElementById('popup-title').style.display = 'none';
        document.getElementById('popup-title-logo').style.display = 'none';
        document.getElementById('popup-file-drop').style.display = 'none';
        document.getElementById('popup-file-download').style.display = 'none';
        document.getElementById('popup-text').style.display = 'none';
        document.getElementById('popup-enter-name').style.display = 'none';
        document.getElementById('popup-close').style.display = 'none';
        document.getElementById('popup-cancel').style.display = 'none';
        document.getElementById('popup-ok').style.display = 'none';
        list_box.style.display = 'none';
        svg_box.style.display = 'none';
        canvas_box.style.display = 'none';
        this.select_gift_cursor = -1;
    };
    this.invoke = function() {
        if (callback_click != null) {
            callback_click();
        }
    };
    this.get_selected = function() {
        let items = document.getElementsByClassName('popup-item-selected');
        let selected = null;
        if (type === 'single') {
            if (items.length >= 1) {
                selected = items[0].getAttribute('data-value');
            }
        } else if (type === 'multi') {
            selected = {};
            for (let i = 0; i < items.length; i++) {
                selected[items[i].getAttribute('data-value')] = true;
            }
            items = document.getElementsByClassName('popup-item');
            for (let i = 0; i < items.length; i++) {
                selected[items[i].getAttribute('data-value')] = false;
            }
        }
        return selected;
    };
    this.set_list_items = function(params) {
        type = params.type;

        let ch;
        while ((ch = list_box.lastChild) != null) {
            list_box.removeChild(ch);
        }

        for (let i = 0; i < params.items.length; i++) {
            const ip = params.items[i];
            const item = document.createElement('div');
            const val = (ip.value != null ? ip.value : ip.text);
            if (params.init === val) {
                item.setAttribute('class', 'popup-item-selected');
            } else if (type === 'multi' && params.init != null && params.init[val]) {
                item.setAttribute('class', 'popup-item-selected');
            } else {
                item.setAttribute('class', 'popup-item');
            }
            item.setAttribute('data-value', val);
            item.textContent = (ip.text_raw != null ? ip.text_raw : resource.gettext(ip.text));
            if (ip.color != null) {
                item.setAttribute('style', 'border:3px solid ' + ip.color);
            }
            item.addEventListener('click', e => {
                const t = e.target;
                if (type === 'single') {
                    const items = document.getElementsByClassName('popup-item-selected');
                    if (items.length >= 1) {
                        items[0].setAttribute('class', 'popup-item');
                    }
                    t.setAttribute('class', 'popup-item-selected');
                } else if (type === 'multi') {
                    if (t.getAttribute('class') === 'popup-item-selected') {
                        t.setAttribute('class', 'popup-item');
                    } else {
                        t.setAttribute('class', 'popup-item-selected');
                    }
                }
                if (callback_click != null) {
                    callback_click();
                }
            });
            list_box.appendChild(item);
        }
    };
    function create_number_input(self, row, x, y) {
        let rect = new_svg_node('rect');
        rect.setAttribute('style', 'fill:#ffffff;stroke:#808080;stroke-width:2px');
        rect.setAttribute('x', x - 24 - 48);
        rect.setAttribute('y', y - 20);
        rect.setAttribute('width', 48);
        rect.setAttribute('height', 24);
        svg.appendChild(rect);

        let text_val = new_svg_node('text');
        text_val.setAttribute('x', x - 28);
        text_val.setAttribute('y', y);
        text_val.setAttribute('class', 'popup-svg-list-item');
        text_val.setAttribute('text-anchor', 'end');
        text_val.textContent = String(row.val);
        svg.appendChild(text_val);

        let down_arrow = new_svg_node('path');
        down_arrow.setAttribute('style', 'fill:#808080;cursor:pointer');
        down_arrow.setAttribute('d', 'M' + (x - 98) + ',' + (y - 20) + ' l12,26 12,-26 z');
        down_arrow.addEventListener('click', row.on_down);
        svg.appendChild(down_arrow);

        let up_arrow = new_svg_node('path');
        up_arrow.setAttribute('style', 'fill:#808080;cursor:pointer');
        up_arrow.setAttribute('d', 'M' + (x - 22) + ',' + (y + 4) + ' l12,-26 12,26 z');
        up_arrow.addEventListener('click', row.on_up);
        svg.appendChild(up_arrow);

        if (row.id != null) {
            self.svg_list_values[row.id] = text_val;
        }
    }
    function draw_h_line(x1, x2, y) {
        let line = new_svg_node('line');
        line.setAttribute('style', 'stroke:#808080;stroke-width:2px');
        line.setAttribute('x1', x1);
        line.setAttribute('x2', x2);
        line.setAttribute('y1', y);
        line.setAttribute('y2', y);
        svg.appendChild(line);
    }
    this.set_svg_list = function(top, key_x, val_x, list) {
        for (let i = 0; i < list.length; i++) {
            let row = list[i];

            if (row.separator != null) {
                draw_h_line(key_x - 16, val_x + 16, top - 10);
            }
            if (row.title != null || row.caption != null) {
                let text_key = new_svg_node('text');
                text_key.setAttribute('x', key_x);
                text_key.setAttribute('y', top);
                if (row.caption != null) {
                    text_key.setAttribute('class', 'popup-svg-list-title');
                    text_key.textContent = resource.gettext(row.caption);
                } else {
                    text_key.setAttribute('class', 'popup-svg-list-item');
                    text_key.textContent = resource.gettext(row.title);
                }
                svg.appendChild(text_key);
            }
            if (row.raw_text != null) {
                let text = new_svg_node('text');
                text.setAttribute('x', key_x);
                text.setAttribute('y', top);
                text.setAttribute('class', 'popup-svg-list-item');
                text.textContent = row.raw_text;
                svg.appendChild(text);
            }

            if (row.val != null) {
                if (row.format === 'input') {
                    create_number_input(this, row, val_x, top);
                } else {
                    let text_val = new_svg_node('text');
                    text_val.setAttribute('x', val_x);
                    text_val.setAttribute('y', top);
                    text_val.setAttribute('class', 'popup-svg-list-item');
                    text_val.setAttribute('text-anchor', 'end');
                    let str;
                    if (typeof(row.val) === 'string') {
                        if (row.format === 'raw') {
                            str = row.val;
                        } else {
                            str = resource.gettext(row.val);
                        }
                    } else {
                        if (typeof(row.format) === 'number') {
                            str = number_format(row.val, row.format);
                        } else if (row.format === '+') {
                            str = number_format_incdec(row.val);
                        } else {
                            str = String(row.val);
                        }
                    }
                    text_val.textContent = str;
                    if (row.id != null) {
                        this.svg_list_values[row.id] = text_val;
                    }
                    svg.appendChild(text_val);
                }
            }

            if (row.unit != null) {
                let text_unit = new_svg_node('text');
                text_unit.setAttribute('x', val_x);
                text_unit.setAttribute('y', top);
                text_unit.setAttribute('class', 'popup-svg-list-item');
                text_unit.textContent = row.unit;
                svg.appendChild(text_unit);
            }
            top += 32;
        }
    };
    this.set_svg_graph = function(city) {
        function draw_graph(data, color) {
            let path = new_svg_node('path');
            path.setAttribute('style', 'fill:none;stroke-width:2px;stroke:' + color);
            let d = [];
            for (let i = 0; i < 12 * GRAPH_YEARS; i++) {
                d.push((i === 0 ? 'M' : 'L') + (16 + i * 2) + ',' + (290 - data[i]));
            }
            path.setAttribute('d', d.join(' '));
            return path;
        }

        let year = city.year % 100;
        let line;
        for (let x = 304 - city.month * 2; x >= 16; x -= 24) {
            let text = new_svg_node('text');
            text.setAttribute('x', x);
            text.setAttribute('y', 305);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'graph-scale-text');
            text.textContent = (year < 10 ? "'0" + year : "'" + year);
            svg.appendChild(text);

            line = new_svg_node('line');
            line.setAttribute('style', 'fill:none;stroke:#808080;stroke-width:1px');
            line.setAttribute('x1', x + 0.5);
            line.setAttribute('y1', 20);
            line.setAttribute('x2', x + 0.5);
            line.setAttribute('y2', 290);
            svg.appendChild(line);

            year--;
            if (year < 0) {
                year = 99;
            }
        }
        this.svg_list_values.r_zones    = draw_graph(city.hist_r, '#00a000');
        this.svg_list_values.c_zones    = draw_graph(city.hist_c, '#0000ff');
        this.svg_list_values.i_zones    = draw_graph(city.hist_i, '#a0a000');
        this.svg_list_values.crime      = draw_graph(city.hist_crime, '#000000');
        this.svg_list_values.pollution  = draw_graph(city.hist_pollution, '#a000a0');
        this.svg_list_values.land_value = draw_graph(city.hist_value, '#008080');
    };
    this.set_svg_item_visible = function(key, visible) {
        let elem = this.svg_list_values[key];
        if (svg.contains(elem)) {
            if (!visible) {
                svg.removeChild(elem);
            }
        } else {
            if (visible) {
                svg.appendChild(elem);
            }
        }
    };
    this.add_svg_button = function(x, y, width, height, id, enabled) {
        let g = new_svg_node('g');
        g.setAttribute('style', 'cursor:pointer');

        let rect = new_svg_node('rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('class', enabled ? 'popup-svg-button-rect' : 'popup-svg-button-rect-disabled');
        g.appendChild(rect);

        let text = new_svg_node('text');
        text.setAttribute('x', x + width / 2);
        text.setAttribute('y', y + height / 2 + 8);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', enabled ? 'popup-svg-button-text' : 'popup-svg-button-text-disabled');
        text.textContent = resource.gettext(id);
        g.appendChild(text);

        svg.appendChild(g);

        if (enabled) {
            g.addEventListener('click', e => {
                if (!suppress_event && callback_close != null) {
                    callback_close(id);
                }
            });
        }
    };
    this.clear_svg = function() {
        let ch;
        while ((ch = svg.lastChild) != null) {
            svg.removeChild(ch);
        }
        this.svg_list_values = {};
    };
    this.set_text_content = function(str) {
        document.getElementById('popup-text').textContent = resource.gettext(str);
    };
    this.set_text_content_raw = function(str) {
        document.getElementById('popup-text').textContent = str;
    };

    this.set_layout = function(left, right) {
        let left_div = null;
        let height = is_title_logo ? 336 : 396;

        switch (left) {
        case 'list':
            left_div = list_box;
            break;
        case 'svg':
            left_div = svg_box;
            break;
        case 'drop':
            left_div = file_drop;
            break;
        case 'text':
            left_div = document.getElementById('popup-text');
            left_div.textContent = '';
            break;
        case 'enter-text':
            left_div = document.getElementById('popup-enter-name');
            document.getElementById('enter-text').value = '';
            document.getElementById('enter-text').style.display = '';
            document.getElementById('enter-text-m').style.display = 'none';
            break;
        case 'enter-text-m':
            left_div = document.getElementById('popup-enter-name');
            document.getElementById('enter-text').style.display = 'none';
            document.getElementById('enter-text-m').style.display = '';
            document.getElementById('enter-text-m').value = '';
            break;
        case 'download':
            left_div = document.getElementById('popup-file-download');
            break;
        case 'canvas-text':
            canvas_box.style.display = '';
            canvas_box.style.zIndex = '-10';
            canvas_box.style.gridRow = '1/5';
            canvas_box.style.gridColumn = '1/3';
            left_div = document.getElementById('popup-text');
            left_div.textContent = '';
            break;
        default:
            if (left === 'canvas' || left.startsWith('canvas:') || left.startsWith('map:')) {
                left_div = canvas_box;
            }
            break;
        }
        left_div.style.display = '';
        left_div.style.gridRow = is_title_logo ? '4' : '3/5';

        if (right == null) {
            left_div.style.gridColumn = '1/3';
            switch (left) {
            case 'drop':
                document.getElementById('popup-file-drop-msg1').textContent = resource.gettext('msg_drop_files1');
                document.getElementById('popup-file-drop-msg2').textContent = resource.gettext('msg_drop_files2');
                return;
            case 'canvas':
                canvas.setAttribute('width', 640 * view.quality);
                canvas.setAttribute('height', height * view.quality);
                canvas.setAttribute('style', 'width:640px;height:' + height + 'px');
                break;
            case 'svg':
                svg.setAttribute('width', 640);
                svg.setAttribute('height', height);
                break;
            case 'text':
                left_div.style.padding = '20px 48px';
                break;
            case 'canvas-text':
                canvas.setAttribute('width', 640 * view.quality);
                canvas.setAttribute('height', 480 * view.quality);
                canvas.setAttribute('style', 'width:640px;height:480px');
                left_div.style.padding = '20px 48px';
                break;
            }
        } else {
            left_div.style.gridColumn = '1';
            let right_div = null;
            switch (right) {
            case 'list':
                right_div = list_box;
                break;
            case 'svg':
                right_div = svg_box;
                break;
            case 'download':
                right_div = document.getElementById('popup-file-download');
                break;
            }
            right_div.style.display = '';
            right_div.style.gridRow = is_title_logo ? '4' : '3/5';
            right_div.style.gridColumn = '2';

            if (left === 'canvas') {
                canvas.setAttribute('width', 320 * view.quality);
                canvas.setAttribute('height', height * view.quality);
                canvas.setAttribute('style', 'width:320px;height:' + height + 'px');
            } else if (left.startsWith('canvas:') || left.startsWith('map:')) {
                let size = parseInt(left.substr(left.indexOf(':') + 1));
                canvas.setAttribute('width', size);
                canvas.setAttribute('height', size);
                canvas.setAttribute('style', 'width:320px;height:320px;image-rendering:auto');
            } else if (left === 'text') {
                left_div.style.padding = '';
            }
            
            if (left === 'svg' || right === 'svg') {
                svg.setAttribute('width', 320);
                svg.setAttribute('height', height);
            } else if (left.startsWith('map:')) {
                svg_box.style.display = '';
                svg_box.style.gridRow = is_title_logo ? '4' : '3/5';
                svg_box.style.gridColumn = '1';
                svg.setAttribute('width', 320);
                svg.setAttribute('height', height);
            }
        }
        if (left === 'svg' || right === 'svg' || left.startsWith('map:')) {
            this.clear_svg();
            this.svg_list_values = {};
        }
    };
    this.show_ok_cancel = function(cmd_ok, cmd_cancel) {
        document.getElementById('popup-cancel').style.display = (cmd_cancel != null ? '' : 'none');
        document.getElementById('popup-ok').style.display = (cmd_ok != null ? '' : 'none');
        document.getElementById('popup-ok-text').textContent = resource.gettext('ok');
        document.getElementById('popup-cancel-text').textContent = resource.gettext('cancel');
        command_ok = cmd_ok;
        command_cancel = cmd_cancel;
    };
    this.show_close_button = function() {
        document.getElementById('popup-close').style.display = '';
        command_ok = null;
        command_cancel = null;
    };
    this.show_logo = function() {
        document.getElementById('popup-window').removeAttribute('class');
        document.getElementById('popup-title-logo').style.display = '';
        list_box.style.gridRow = '4';
        list_box.style.gridColumn = '1/3';
        is_title_logo = true;
    };
    this.set_title = function(title) {
        this.set_title_raw(resource.gettext(title));
    };
    this.set_title_raw = function(title) {
        document.getElementById('popup-window').setAttribute('class', 'popup-frame');
        document.getElementById('popup-title').style.display = '';
        list_box.style.gridRow = '3/5';
        list_box.style.gridColumn = '1/3';
        document.getElementById('popup-title').textContent = title;
        is_title_logo = false;
    };
    this.set_back_transparent = function() {
        window_back.style.background = '';
    };
    this.set_back_half_opacity = function() {
        window_back.style.background = 'rgba(0,0,0,0.5)';
    };
    function put_pixel_at(data, pos, r, g, b) {
        data[pos + 0] = r;
        data[pos + 1] = g;
        data[pos + 2] = b;
        data[pos + 3] = 255;
        data[pos + 4] = r;
        data[pos + 5] = g;
        data[pos + 6] = b;
        data[pos + 7] = 255;
    }
    function put_pixel_brend(data, pos, r, g, b) {
        data[pos + 0] = (data[pos + 0] + r * 3) >> 2;
        data[pos + 1] = (data[pos + 1] + g * 3) >> 2;
        data[pos + 2] = (data[pos + 2] + b * 3) >> 2;
        data[pos + 4] = (data[pos + 4] + r * 3) >> 2;
        data[pos + 5] = (data[pos + 5] + g * 3) >> 2;
        data[pos + 6] = (data[pos + 6] + b * 3) >> 2;
    }
    function put_pixel(data, x, y, w, color) {
        let x1 = (x - y) + w / 2;
        let y1 = (x + y);
        let pos = (x1 + y1 * w) * 4;

        let r = color >> 16;
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;
        put_pixel_at(data, pos, r, g, b);
    }
    function put_pixel4(data, x, y, w, color) {
        let x1 = (x - y) + w / 2;
        let y1 = (x + y);
        let r = color >> 16;
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;

        let pos = (x1 + y1 * w) * 4;
        put_pixel_brend(data, pos, r, g, b);
        pos += (w - 1) * 4;
        put_pixel_brend(data, pos, r, g, b);
        pos += 8;
        put_pixel_brend(data, pos, r, g, b);
        pos += (w - 1) * 4;
        put_pixel_brend(data, pos, r, g, b);
    }
    function grayscale(lv) {
        if (lv < 192) {
            lv = lv + 64;
            return lv | (lv << 8) | (lv << 16);
        } else {
            return 0xffffff;
        }
    }
    function heatmap(lv) {
        if (lv < 64) {
            // #008000 -> #00ff00
            return 0x008000 | (lv << 9);
        } else if (lv < 128) {
            // #00ff00 -> #ffff00
            return 0x00ff00 | ((lv - 64) << 18);
        } else if (lv < 192) {
            // #ffff00 -> #ff0000
            return 0xff0000 | ((191 - lv) << 10);
//        } else if (lv < 256) {
//            // #ff0000 -> #ffffff
//            return 0xff0000 | ((lv - 192) << 10) | ((lv - 192) << 2);
        } else {
            return 0xff0000;
        }
    }
    this.draw_map_q = function(city) {
        const w = canvas.width;
        const map_size = city.map_size;
        const map_size_edge = city.map_size_edge;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        for (let y = 0; y < map_size; y++) {
            let line = 1 + (y + 1) * map_size_edge;

            for (let x = 0; x < map_size; x++) {
                let color = 0;
                let t = city.tile_data[line + x];

                switch (t) {
                case M_WATER:
                case M_WIRE_WT:
                    color = 0x4060FF;
                    break;
                case M_LAND:
                case M_WIRE:
                    color = 0xC0C080;
                    break;
                case M_ROAD:
                case M_ROAD_WT:
                case M_ROAD_WT | F_CENTER:
                case M_ROADWIRE:
                case M_ROADRAIL:
                    color = 0x000000;
                    break;
                case M_RAIL:
                case M_RAILWIRE:
                case M_RAIL_WT:
                case M_RAIL_WT | F_CENTER:
                    color = 0x000080;
                    break;
                case M_TREE:
                    color = 0x40A040;
                    break;
                case M_RUBBLE:
                    color = 0x909050;
                    break;
                default:
                    switch (t & F_BLDGS) {
                    case M_R_ZONE:
                        color = 0x00E000;
                        break;
                    case M_C_ZONE:
                        color = 0x6060FF;
                        break;
                    case M_I_ZONE:
                        color = 0xFFA000;
                        break;
                    default:
                        if ((t & 0x3F00) !== 0) {
                            color = 0x606060;
                        } else {
                            color = 0xC0C080;
                        }
                        break;
                    }
                    break;
                }
                put_pixel(imData.data, x, y, w, color);
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
    this.draw_map_base = function(city, all_zone) {
        const w = canvas.width;
        const map_size = city.map_size;
        const map_size_edge = city.map_size_edge;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        for (let y = 0; y < map_size; y++) {
            let line = 1 + (y + 1) * map_size_edge;

            for (let x = 0; x < map_size; x++) {
                let color = 0;

                let t = city.tile_data[line + x];
                switch (t) {
                case M_WATER:
                    color = 0x408080;
                    break;
                case M_TREE:
                    color = 0x70c0c0;
                    break;
                case M_ROAD:
                case M_ROAD_WT:
                case M_ROAD_WT | F_CENTER:
                case M_RAIL:
                case M_RAIL_WT:
                case M_RAIL_WT | F_CENTER:
                case M_ROADRAIL:
                case M_ROADWIRE:
                case M_RAILWIRE:
                    color = 0x204040;
                    break;
                default:
                    color = 0x68b0b0;
                    t = t & F_BLDGS;
                    if (t !== M_LAND) {
                        color = 0x88e8e0;
                        if (all_zone) {
                            switch (t) {
                            case M_R_ZONE:
                                color = 0x00E000;
                                break;
                            case M_C_ZONE:
                                color = 0x6060FF;
                                break;
                            case M_I_ZONE:
                                color = 0xFFA000;
                                break;
                            }
                        }
                    }
                    break;
                }
                put_pixel(imData.data, x, y, w, color);
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
    this.draw_map_power = function(city) {
        const w = canvas.width;
        const map_size = city.map_size;
        const map_size_edge = city.map_size_edge;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        for (let y = 0; y < map_size; y++) {
            let line = 1 + (y + 1) * map_size_edge;

            for (let x = 0; x < map_size; x++) {
                let t = city.tile_data[line + x];
                switch (t & F_BLDGS) {
                case M_COAL_PWR:
                case M_GAS_PWR:
                case M_NUKE_PWR:
                    put_pixel(imData.data, x, y, w, this.color_scheme ? 0xFFFFFF : 0xFF0000);
                    break;
                default:
                    t = city.tile_power[line + x];
                    if (t === 1) {
                        put_pixel(imData.data, x, y, w, this.color_scheme ? 0x404040 : 0x008000);
                    } else if (t === 2) {
                        put_pixel(imData.data, x, y, w, this.color_scheme ? 0xD0D0D0 : 0xFF8000);
                    }
                    break;
                }
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
    this.draw_map_transport = function(city) {
        const w = canvas.width;
        const map_size = city.map_size;
        const map_size_edge = city.map_size_edge;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        for (let y = 0; y < map_size; y++) {
            let line = 1 + (y + 1) * map_size_edge;

            for (let x = 0; x < map_size; x++) {
                let color = 0;
                let t = city.tile_data[line + x];
                switch (t & F_BLDGS) {
                case M_STATION:
                    put_pixel(imData.data, x, y, w, 0xA0A000);
                    break;
                case M_GOODS_ST:
                    put_pixel(imData.data, x, y, w, 0xA0A000);
                    break;
                default:
                    if ((t & M_ROAD_WT) !== 0) {
                        put_pixel(imData.data, x, y, w, 0x0000FF);
                    } else if ((t & M_RAIL_WT) !== 0) {
                        put_pixel(imData.data, x, y, w, 0xFFFF00);
                    }
                    break;
                }
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
    this.draw_map_traffic = function(city) {
        const w = canvas.width;
        const map_size = city.map_size;
        const map_size_edge = city.map_size_edge;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        for (let y = 0; y < map_size; y++) {
            let line = 1 + (y + 1) * map_size_edge;

            for (let x = 0; x < map_size; x++) {
                let t = city.tile_road[line + x];
                if (t > 0 && t < 255) {
                    put_pixel(imData.data, x, y, w, this.color_scheme ? grayscale(t * 6) : heatmap(t * 6));
                }
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
    this.draw_map_disaster = function(city) {
        const w = canvas.width;
        const map_size = city.map_size;
        const map_size_edge = city.map_size_edge;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        for (let y = 0; y < map_size; y++) {
            let line = 1 + (y + 1) * map_size_edge;

            for (let x = 0; x < map_size; x++) {
                switch (city.tile_fire[line + x]) {
                case MF_FIRE:
                    put_pixel(imData.data, x, y, w, 0xff0000);
                    break;
                case MF_FLOOD:
                    put_pixel(imData.data, x, y, w, 0x0000ff);
                    break;
                case MF_RADIO:
                    put_pixel(imData.data, x, y, w, 0xffff00);
                    break;
                }
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
    this.draw_map_data2 = function(city, data, multiply) {
        const w = canvas.width;
        const map_size2 = city.map_size2;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        for (let y = 0; y < map_size2; y++) {
            for (let x = 0; x < map_size2; x++) {
                let t = data[x + y * map_size2];
                if (t > 0) {
                    let color = this.color_scheme ? grayscale(t * multiply) : heatmap(t * multiply);
                    put_pixel4(imData.data, x << 1, y << 1, w, color);
                }
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
    this.draw_map_data8 = function(city, data) {
        const w = canvas.width;
        const map_size8 = city.map_size >> 3;
        const ctx = canvas.getContext('2d');
        const imData = ctx.getImageData(0, 0, w, w);

        for (let y = 0; y < map_size8; y++) {
            for (let x = 0; x < map_size8; x++) {
                let t = data[x + y * map_size8];
                let color = 0;
                if (t <= -3) {
                    color = this.color_scheme ? grayscale(0) : heatmap(0);
                } else if (t <= -2) {
                    color = this.color_scheme ? grayscale(64) : heatmap(64);
                } else if (t >= 4) {
                    color = this.color_scheme ? grayscale(128) : heatmap(160);
                } else if (t >= 3) {
                    color = this.color_scheme ? grayscale(192) : heatmap(192);
                }
                if (color !== 0) {
                    for (let yy = 0; yy < 8; yy += 2) {
                        for (let xx = 0; xx < 8; xx += 2) {
                            put_pixel4(imData.data, (x << 3) + xx, (y << 3) + yy, w, color);
                        }
                    }
                }
            }
        }

        ctx.putImageData(imData, 0, 0);
    };
    this.set_map_legand = function(list) {
        this.clear_svg();

        let x = 10;
        let y = 340;
        for (let i = 0; i < list.length; i++) {
            let o = list[i];
            if (o === 'heatmap') {
                for (let j = 32; j < 192; j += 16) {
                    let rect = new_svg_node('rect');
                    rect.setAttribute('x', x);
                    rect.setAttribute('y', y);
                    rect.setAttribute('width', 10);
                    rect.setAttribute('height', 24);
                    let c = this.color_scheme ? grayscale(j) : heatmap(j);
                    rect.setAttribute('style', 'fill:#' + ('00000' + c.toString(16)).substr(-6));
                    svg.appendChild(rect);

                    x += 10;
                }
            } else {
                let rect = new_svg_node('rect');
                rect.setAttribute('x', x);
                rect.setAttribute('y', y);
                rect.setAttribute('width', 100);
                rect.setAttribute('height', 24);
                rect.setAttribute('style', 'fill:' + o.color);
                svg.appendChild(rect);

                let text = new_svg_node('text');
                text.setAttribute('x', x + 50);
                text.setAttribute('y', y + 18);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('style', 'font-size:75%;fill:' + o.text_color);
                if (o.text_raw) {
                    text.textContent = o.text_raw;
                } else {
                    text.textContent = resource.gettext(o.text);
                }
                svg.appendChild(text);

                x += 100;
            }
        }
    };
    this.set_legand_heatmap = function(high_low) {
        let list;
        if (high_low) {
            list = [
                {text: 'low', color: (this.color_scheme ? '#404040' : '#008000'), text_color: '#FFFFFF' },
                'heatmap',
                {text: 'high', color: (this.color_scheme ? '#FFFFFF' : '#FF0000'), text_color: '#000000' },
            ];
        } else {
            list = [
                {text_raw: '-', color: (this.color_scheme ? '#404040' : '#008000'), text_color: '#FFFFFF' },
                'heatmap',
                {text_raw: '+', color: (this.color_scheme ? '#FFFFFF' : '#FF0000'), text_color: '#000000' },
            ];
        }
        this.set_map_legand(list);
    };
    function show_map_marker(map_size, o, symbol, color) {
        let f = 160 / (map_size * 16);
        let x = 160 + (o.x - o.y) * f;
        let y = (o.x + o.y) * f;

        let b = new_svg_node('rect');
        b.setAttribute('x', x - 6);
        b.setAttribute('y', y - 6);
        b.setAttribute('width', 12);
        b.setAttribute('height', 12);
        b.setAttribute('style', 'stroke:#000000;stroke-width:1px;fill:' + color);
        svg.appendChild(b);

        let t = new_svg_node('text');
        t.setAttribute('x', x);
        t.setAttribute('y', y + 4);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('style', 'fill:#000000;font-size:10px');
        t.textContent = symbol;
        svg.appendChild(t);
    }
    this.show_vehicle_position = function(city, view) {
        if (view.airplane.dir >= 0) {
            show_map_marker(city.map_size, view.airplane, 'A', '#ffffff');
        }
        if (view.helicopter.dir >= 0) {
            show_map_marker(city.map_size, view.helicopter, 'H', '#ff8080');
        }
        if (view.container_ship.dir >= 0) {
            show_map_marker(city.map_size, view.container_ship, 'S', '#8080ff');
        }
        if (view.train[0].d1 >= 0) {
            let t = view.train[0];
            show_map_marker(city.map_size, {x: t.x * 16, y: t.y *16}, 'T', '#ffff80');
        }
    };
    this.show_disaster_position = function(city, view) {
        if (view.tornado.dir >= 0) {
            show_map_marker(city.map_size, view.tornado, 'T', '#8080ff');
        }
        if (view.monster.dir >= 0) {
            show_map_marker(city.map_size, view.monster, 'M', '#80ff80');
        }
        if (view.ufo_disaster.dir >= 0) {
            show_map_marker(city.map_size, view.ufo_disaster, 'U', '#ff8080');
        }
    };

    document.getElementById('popup-cancel').addEventListener('click', e => {
        if (callback_close != null) {
            callback_close(command_cancel);
        }
    });
    document.getElementById('popup-ok').addEventListener('click', e => {
        if (callback_close != null) {
            callback_close(command_ok);
        }
    });
    document.getElementById('popup-window').addEventListener('click', e => {
        if (this.select_gift_cursor >= 0) {
            let w = document.getElementById('popup-window');
            let x = e.clientX - w.offsetLeft;
            let y = e.clientY - w.offsetTop;
            if (x >= 40 && x < 296 && y >= 210 && y < 338) {
                if (x < 168) {
                    this.select_gift_cursor = 0;
                } else {
                    this.select_gift_cursor = 1;
                }
            }
            draw_gift_cursor(this);
        }
        e.stopPropagation();
    });
    window_back.addEventListener('mousemove', event_cancel);
    window_back.addEventListener('mousedown', event_cancel);
    window_back.addEventListener('mouseup', event_cancel);
    window_back.addEventListener('click', event_cancel);

    window_back.addEventListener('click', e => {
        if (!suppress_event && callback_close != null) {
            callback_close('close');
        }
    });
    document.getElementById('popup-close').addEventListener('click', e => {
        if (callback_close != null) {
            callback_close('close');
        }
    });
    file_drop.addEventListener('dragenter', e => {
        file_drop.style.background = '#ffff80';
        e.preventDefault();
        e.stopPropagation();
    });
    file_drop.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
    });
    file_drop.addEventListener('dragleave', e => {
        file_drop.style.background = 'none';
    });
    file_drop.addEventListener('drop', e => {
        let dt = e.dataTransfer;
        if (dt.files != null && dt.files.length === 1) {
            if (this.callback_readfile != null) {
                this.callback_readfile(dt.files[0]);
            }
        }
        file_drop.style.background = '';
        e.preventDefault();
        e.stopPropagation();
    });
    document.getElementById('popup-file-select').addEventListener('change', e => {
        let t = e.target;
        if (t.files != null && t.files.length >= 1) {
            if (this.callback_readfile != null) {
                this.callback_readfile(t.files[0]);
            }
        }
    });
    document.getElementById('popup-enter-name-button').addEventListener('click', e => {
        if (callback_close != null) {
            callback_close('enter_name_button');
        }
    });
}
