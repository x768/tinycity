'use strict';

(fn => {
    if (document.readyState !== 'loading'){
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
})(() => {
    const DIR4_X = [
        0, 1, 0, -1,
    ];
    const DIR4_Y = [
        -1, 0, 1, 0,
    ];
    const DIR8_X = [
        0, -1, -1, -1, 0, 1, 1, 1,
    ];
    const DIR8_Y = [
        1, 1, 0, -1, -1, -1, 0, 1,
    ];
    const BAKNRUPT_LIMIT = -10000;

    const view = new View(window.devicePixelRatio);
    const popup = new Popup(view);
    const simulate = new Simulate();

    const main_view = document.getElementById('main-view');

    let city = null;
    let current_build_index = 0;
    let current_build = null;
    let current_speed = null;
    let lbuttondown = false;
    let rbuttondown = false;
    let build_icon_info = BUILD_ICON_INFO_TINYCITY;
    let city_tmp = null;
    let map_type_selected = null;
    let graph_selected = null;
    let init_filename = null;

    let is_airplane_arrival = false;
    let earthquake_time_left = 0;
    let tornado_time_left = 0;
    let monster_time_left = 0;
    let ufo_tick_time = -1;
    let ufo_target = null;

    let options = {
        auto_bulldoze: window.localStorage.getItem('no_auto_bulldoze') == null,
        popup_window:  window.localStorage.getItem('no_popup_window') == null,
        sound_effect:  window.localStorage.getItem('no_sound_effect') == null,
        color_bf_mode: window.localStorage.getItem('color_bf_mode') != null,
    };
    function update_options() {
        let s = window.localStorage;
        function set_strage(key, b) {
            if (b) {
                s.setItem(key, 'true');
            } else {
                s.removeItem(key);
            }
        }
        set_strage('no_auto_bulldoze', !options.auto_bulldoze);
        set_strage('no_popup_window', !options.popup_window);
        set_strage('no_sound_effect', !options.sound_effect);
        set_strage('color_bf_mode', options.color_bf_mode);
    }
    function is_world_freeze() {
        return earthquake_time_left > 0 || ufo_target != null;
    }

    function get_city_category(population) {
        if (city.population < 2000) {
            return 'village';
        } else if (city.population < 10000) {
            return 'town';
        } else if (city.population < 50000) {
            return 'city';
        } else if (city.population < 100000) {
            return 'capital';
        } else if (city.population < 500000) {
            return 'metropolis';
        } else {
            return 'megalopolis';
        }
    }
    function get_next_category_pops(population) {
        if (city.population < 2000) {
            return 2000;
        } else if (city.population < 10000) {
            return 10000;
        } else if (city.population < 50000) {
            return 50000;
        } else if (city.population < 100000) {
            return 100000;
        } else if (city.population < 500000) {
            return 500000;
        } else if (city.population < 700000) {
            return 700000;
        } else {
            return -1;
        }
    }

    // call when switch language
    function update_menu_text() {
        function set_menu(id) {
            document.getElementById('menu-' + id).textContent = resource.gettext(id);
        }
        set_menu('file');
        set_menu('options');
        set_menu('budget');
        let menu_debt = document.getElementById('menu-debt');
        if (city.bank_working && city.fund !== 'infinity') {
            menu_debt.style.display = '';
            menu_debt.textContent = resource.gettext(city.ruleset === 'tinycity' ? 'bond' : 'loan');
        } else {
            menu_debt.style.display = 'none';
        }
        set_menu('disaster');
        set_menu('evaluation');
        set_menu('graph');
        set_menu('map');
        set_menu('statistics');
        set_menu('election');
        document.getElementById('demand-symbol-r').textContent = resource.gettext('symbol_r');
        document.getElementById('demand-symbol-c').textContent = resource.gettext('symbol_c');
        document.getElementById('demand-symbol-i').textContent = resource.gettext('symbol_i');
    }
    // call when switch language
    function update_indicator() {
        document.getElementById('indicator-date').textContent = resource.datestr(city.year, city.month);
        document.getElementById('indicator-population').textContent = String(city.population);
        document.getElementById('indicator-fund').textContent = (city.funds !== 'infinity' ? String(city.funds) : resource.gettext('infinity'));
    }
    // call when switch language
    function update_build_icons() {
        view.set_build_cursor(current_build_index);
        view.set_cursor_size(current_build.size);
        document.getElementById('indicator-select-name').textContent = resource.gettext(current_build.name);
        document.getElementById('indicator-select-cost').textContent = (current_build.cost > 0 ? '$' + current_build.cost : '-');
    }
    // visible location and compass
    function update_minimap() {
        document.getElementById('minimap-compass').setAttribute('transform', 'rotate(' + (city.rotate * 90 + 45) + ')');
        view.update_minimap();
    }
    // update speed and buttons
    function update_speed() {
        view.set_speed_button(current_speed);
    }

    function build_tile() {
        let cost = city.calc_build_cost_at(view.cursor_x, view.cursor_y, current_build);
        if (cost >= 0 && (city.funds === 'infinity' || city.funds >= cost)) {
            if (city.funds !== 'infinity') {
                city.funds -= cost;
                document.getElementById('indicator-fund').textContent = String(city.funds);
            }
            let update_rect = city.build_tile_at(view.cursor_x, view.cursor_y, current_build);
            if (update_rect != null) {
                view.update_tile_range(city, update_rect.x1, update_rect.x2, update_rect.y1, update_rect.y2);
                if (current_build.name === 'bulldoze') {
                    view.remove_small_house(city, view.cursor_x, view.cursor_y);
                } else if (current_build_index >= build_icon_info.length) {
                    if (current_build.name === 'bank') {
                        city.bank_working = true;
                        update_menu_text();
                    }
                    // erase gift building
                    city.gift_buildings.splice(current_build_index - build_icon_info.length, 1);
                    current_build_index = 0;
                    current_build = build_icon_info[0];
                    view.draw_build_icons(city, city.gift_buildings, build_icon_info.length >> 1);
                    update_build_icons();
                }
            }
        }
    }
    function build_range() {
        let cost = city.calc_build_cost_range(view.cursor_x_begin, view.cursor_y_begin, view.cursor_x, view.cursor_y, current_build);
        if (cost >= 0 && (city.funds === 'infinity' || city.funds >= cost)) {
            if (city.funds !== 'infinity') {
                city.funds -= cost;
                document.getElementById('indicator-fund').textContent = String(city.funds);
            }
            let update_rect = city.build_tile_range(view.cursor_x_begin, view.cursor_y_begin, view.cursor_x, view.cursor_y, current_build);
            if (update_rect != null) {
                view.update_tile_range(city, update_rect.x1, update_rect.x2, update_rect.y1, update_rect.y2);
            }
        }
    }
    function reset_mouse_drag() {
        if (lbuttondown) {
            lbuttondown = false;
            view.set_end_cursor();
        }
        if (rbuttondown) {
            rbuttondown = false;
        }
    }
    function show_title_screen_main() {
        view.show_message_ticker_raw(null, true);
        popup.reset();
        popup.set_back_transparent();
        popup.show_logo();
        popup.set_layout('list', null);
        popup.set_list_items({
            type: 'single',
            init: '',
            items: [
                {text: 'start_city'},
                {text: 'load_file'},
                {text: 'options'},
                {text: 'language'},
            ],
        });
    }
    function show_options_window() {
        popup.reset();
        popup.set_title('options');
        popup.set_layout('list', null);
        popup.show_ok_cancel('options_ok', 'options_cancel');
        popup.set_list_items({
            type: 'multi',
            init: options,
            items: [
                {text: 'auto_bulldoze'},
                {text: 'popup_window'},
                //{text: 'sound_effect'},
                {text: 'color_bf_mode'},
            ],
        });
    }
    function show_title_screen_rule() {
        popup.reset();
        popup.show_ok_cancel('rule_ok', 'rule_cancel');
        popup.set_title('ruleset');
        popup.set_layout('text', 'list');
        popup.set_list_items({
            type: 'single',
            init: city.ruleset,
            items: [
                {text: 'micropolis'},
                {text: 'tinycity'},
            ],
        });
    }
    function show_title_screen_map(map_generator) {
        popup.reset();
        popup.show_ok_cancel('map_ok', 'map_cancel');
        popup.set_title('generate_terrain');
        popup.set_layout('canvas:' + (city.map_size * 2 + 2), 'list');
        popup.set_list_items({
            type: 'single',
            init: map_generator,
            items: [
                {text: 'river'},
                {text: 'coast'},
                {text: 'lake'},
                {text: 'island'},
            ],
        });
    }
    function show_title_screen_name() {
        popup.reset();
        popup.show_ok_cancel('name_ok', 'name_cancel');
        popup.set_title('naming_city');
        popup.set_layout('enter-text');
        document.getElementById('popup-enter-name-button').textContent = resource.gettext('get_random');
        let txt = document.getElementById('enter-text');
        if (city.city_name === '') {
            let generator = new GenerateMap();
            city.city_name = generator.get_random_name();
        }
        txt.value = city.city_name;
        txt.focus();
    }
    function show_title_screen_dif() {
        popup.reset();
        popup.show_ok_cancel('dif_ok', 'dif_cancel');
        popup.set_title('difficulty');
        popup.set_layout('svg', 'list');
        popup.set_list_items({
            type: 'single',
            init: city.difficulty,
            items: [
                {text: 'creative'},
                {text: 'peaceful'},
                {text: 'novice'},
                {text: 'expert'},
                {text: 'master'},
            ],
        });
    }
    function show_goodbye() {
        view.init_full_canvas();
        popup.quit_mode('msg_see_you');
        current_speed = 'title';
    }
    function start_game() {
        popup.close();
        view.init_maptip();
        view.init_game_canvas();

        document.getElementById('menu-election').style.display = (city.election != null ? '' : 'none');

        simulate.flood_time_left = city.flood_time_left;
        if (city.tornado != null) {
            let t = city.tornado;
            let v = view.tornado;
            v.dir = t.dir;
            v.x   = t.x;
            v.y   = t.y;
            v.d   = t.d;
            v.dx  = t.dx;
            v.dy  = t.dy;
            tornado_time_left = t.left;
        }
        if (city.monster != null) {
            let m = city.monster;
            let v = view.monster;
            v.dir = m.dir;
            v.x   = m.x;
            v.y   = m.y;
            v.d   = m.d;
            v.dx  = m.dx;
            v.dy  = m.dy;
            monster_time_left = m.left;
        }
        simulate.set_city(city);
        city.game_start(simulate);

        view.set_tiles(city);
        switch (city.ruleset) {
        case 'tinycity':
            build_icon_info = BUILD_ICON_INFO_TINYCITY;
            break;
        case 'micropolis':
            build_icon_info = BUILD_ICON_INFO_MICROPOLIS;
            break;
        }
        current_build_index = 0;
        current_build = build_icon_info[current_build_index];
        current_speed = 'normal';
        map_type_selected = 'all_zones';
        graph_selected = {
            r_zones: true,
            c_zones: true,
            i_zones: true,
            crime: false,
            pollution: false,
            land_value: false,
        };

        view.draw_build_icons(city, build_icon_info, 0);
        view.draw_build_icons(city, city.gift_buildings, build_icon_info.length >> 1);
        document.getElementById('minimap-city-name').textContent = city.city_name;

        city.update_problems();

        city.calculate_power_grid_required = true;
        city.update_power_grid_required = true;
        city.auto_bulldoze = options.auto_bulldoze;

        popup.color_scheme = options.color_bf_mode;
        view.color_scheme = options.color_bf_mode;
        view.update_demand_bar(city);
        view.update_tile_rci(city);
        view.update_road_traffic(city);

        update_menu_text();
        update_indicator();
        update_speed();
        update_build_icons();
        update_minimap();
        view.clear_view();
    }
    function show_title_screen() {
        city = new City(MAP_SIZE_DEFAULT);
        let generator = new GenerateMap();
        let map_generator = 'river';

        current_speed = 'title';
        show_title_screen_main();
        view.init_full_canvas();
        popup.open(() => {
            let selected = popup.get_selected();
            switch (selected) {
            case 'start_city':
                show_title_screen_rule();
                popup.invoke();
                break;
            case 'load_file':
                popup.reset();
                popup.set_title('load_file');
                popup.set_layout('drop', null);
                popup.show_ok_cancel(null, 'drop_cancel');
                break;
            case 'options':
                show_options_window();
                break;
            case 'language':
                popup.reset();
                popup.set_title('language');
                popup.set_layout('svg', 'list');
                popup.show_ok_cancel('lang_ok', 'lang_cancel');
                popup.set_list_items({
                    type: 'single',
                    init: 'lang_' + resource.current_language,
                    items: resource.language_menu,
                });
                popup.invoke();
                break;
            case 'tinycity':
                popup.set_text_content('msg_rule_tinycity');
                break;
            case 'micropolis':
                popup.set_text_content('msg_rule_micropolis');
                break;
            case 'river':
                map_generator = selected;
                generator.make_river();
                popup.draw_map_q(city);
                break;
            case 'coast':
                map_generator = selected;
                generator.make_coast();
                popup.draw_map_q(city);
                break;
            case 'lake':
                map_generator = selected;
                generator.make_lake();
                popup.draw_map_q(city);
                break;
            case 'island':
                map_generator = selected;
                generator.make_island();
                popup.draw_map_q(city);
                break;
            case 'creative':
                popup.clear_svg();
                popup.set_svg_list(32, 48, 280, [
                    {title:'funds', val:'infinity'},
                    {title:'cost', val:'cheap'},
                    {title:'disaster', val:'none'},
                ]);
                break;
            case 'peaceful':
                popup.clear_svg();
                popup.set_svg_list(32, 48, 280, [
                    {title:'funds', val:20000},
                    {title:'cost', val:'cheap'},
                    {title:'disaster', val:'none'},
                ]);
                break;
            case 'novice':
                popup.clear_svg();
                popup.set_svg_list(32, 48, 280, [
                    {title:'funds', val:20000},
                    {title:'cost', val:'cheap'},
                    {title:'disaster', val:'rare'},
                ]);
                break;
            case 'expert':
                popup.clear_svg();
                popup.set_svg_list(32, 48, 280, [
                    {title:'funds', val:10000},
                    {title:'cost', val:'expensive'},
                    {title:'disaster', val:'rare'},
                ]);
                break;
            case 'master':
                popup.clear_svg();
                popup.set_svg_list(32, 48, 280, [
                    {title:'funds', val:5000},
                    {title:'cost', val:'expensive'},
                    {title:'disaster', val:'frequent'},
                ]);
                break;
            default:
                if (typeof(selected) === 'string' && selected.startsWith('lang_')) {
                    selected = selected.substring(5);
                    popup.clear_svg();
                    let info = resource.language_info[selected];
                    let list = [
                        {raw_text:'Progress', val:info.progress, unit:'%'},
                        {raw_text:'Quality', val:(info.quality === 'A' ? 'Sufficient' : 'Correction needed'), format:'raw'},
                        {raw_text:'Authors', val:info.authors[0], format:'raw'},
                    ];
                    for (let i = 1; i < info.authors.length; i++) {
                        list.push({val:info.authors[i], format:'raw'});
                    }
                    popup.set_svg_list(28, 40, 300, list);
                }
                break;
            }
        }, mode => {
            switch (mode) {
            case 'lang_ok':
                {
                    let selected = popup.get_selected().substring(5);
                    if (resource.current_language !== selected) {
                        resource.set_language(selected, show_title_screen_main);
                    } else {
                        show_title_screen_main();
                    }
                }
                break;
            case 'options_ok':
                options = popup.get_selected();
                update_options();
                show_title_screen_main();
                break;
            case 'rule_ok':
                generator.set_city(city);
                city.ruleset = popup.get_selected();
                show_title_screen_map(map_generator);
                popup.invoke();
                break;
            case 'map_ok':
                show_title_screen_name();
                break;
            case 'name_ok':
                {
                    let name = document.getElementById('enter-text').value;
                    if (name.length > 0) {
                        city.city_name = name;
                        show_title_screen_dif();
                        popup.invoke();
                    }
                }
                break;
            case 'dif_ok':
                city.difficulty = popup.get_selected();
                switch (city.difficulty) {
                case 'creative':
                    city.funds = 'infinity';
                    break;
                case 'peaceful':
                    city.funds = 20000;
                    break;
                case 'novice':
                    city.funds = 20000;
                    break;
                case 'expert':
                    city.funds = 10000;
                    break;
                case 'master':
                    city.funds = 5000;
                    break;
                }
                start_game();
                break;
            case 'file_ok':
                city = city_tmp;
                start_game();
                break;
            case 'options_cancel':
            case 'lang_cancel':
            case 'drop_cancel':
            case 'rule_cancel':
                show_title_screen_main();
                break;
            case 'map_cancel':
                show_title_screen_rule();
                popup.invoke();
                break;
            case 'name_cancel':
                show_title_screen_map(map_generator);
                popup.draw_map_q(city);
                break;
            case 'dif_cancel':
                show_title_screen_name();
                break;
            case 'file_cancel':
                popup.reset();
                popup.set_title('load_file');
                popup.set_layout('drop', null);
                popup.show_ok_cancel(null, 'drop_cancel');
                break;
            case 'enter_name_button':
                document.getElementById('enter-text').value = generator.get_random_name();
                break;
            }
        });
    }

    document.getElementById('build-icons').addEventListener('click', e => {
        if (city.disaster_occurs && city.ruleset === 'tinycity') {
            return;
        }
        let idx = Math.floor((e.clientX - e.target.parentElement.offsetLeft) / 64) * 2;
        if ((e.clientY - e.target.parentElement.offsetTop) >= 48) {
            idx++;
        }
        if (idx < build_icon_info.length) {
            current_build_index = idx;
            current_build = build_icon_info[current_build_index];
            update_build_icons();
        } else {
            let idx2 = idx - build_icon_info.length;
            if (idx2 < city.gift_buildings.length) {
                current_build_index = idx;
                current_build = city.gift_buildings[idx2];
                update_build_icons();
            }
        }
    });

    main_view.addEventListener('mousedown', e => {
        if (e.button === 0) {
            if (is_world_freeze()) {
                return;
            }
            switch (current_build.name) {
            case 'inspect':
                {
                    let info = city.get_info_at(view.cursor_x, view.cursor_y);
                    if (info != null) {
                        popup.reset();
                        popup.set_back_half_opacity();
                        popup.show_close_button();
                        popup.set_title(info.name);
                        popup.set_layout('canvas', 'svg');
                        if (info.size === 4 || info.size === 6) {
                            info.y++;
                        }
                        view.draw_maptip_inspect(popup.get_canvas(), info.x, info.y, 160, 160);
                        popup.set_svg_list(32, 8, 240, info.list);
                        popup.open(null, mode => {
                            popup.close();
                        });
                    }
                }
                break;
            case 'bulldoze':
                if (city.is_building(view.cursor_x, view.cursor_y) ||
                    city.is_bridge(view.cursor_x, view.cursor_y))
                {
                    build_tile();
                } else if (view.cursor_x >= 0) {
                    lbuttondown = true;
                    view.set_begin_cursor(1);
                }
                break;
            case 'road':
            case 'railroad':
            case 'wire':
                {
                    let pos = view.cursor_x + 1 + (view.cursor_y + 1) * city.map_size_edge;
                    if (city.tile_data[pos] === M_WATER) {
                        build_tile();
                    } else if ((city.tile_data[pos] & M_LAND) !== 0 && view.cursor_x >= 0) {
                        lbuttondown = true;
                        view.set_begin_cursor(2);
                    }
                }
                break;
            case 'tree':
                lbuttondown = true;
                build_tile();
                break;
            default:
                build_tile();
                break;
            }
        } else if (e.button === 2) {
            rbuttondown = true;
            view.begin_scroll(e.clientX, e.clientY);
        }
    });
    document.addEventListener('mouseup', e => {
        if (lbuttondown) {
            lbuttondown = false;
            if (!is_world_freeze()) {
                build_range();
            }
            view.set_end_cursor();
        }
        if (rbuttondown) {
            rbuttondown = false;
        }
    });
    main_view.addEventListener('mousemove', e => {
        if (rbuttondown) {
            view.scroll(e.clientX, e.clientY);
            view.limit_scroll();
        } else if (!is_world_freeze()) {
            view.update_cursor_pos(e.clientX - main_view.offsetLeft, e.clientY - main_view.offsetTop);
            if (lbuttondown && current_build.name === 'tree') {
                build_tile();
            }
        }
        e.preventDefault();
    });
    main_view.addEventListener('mouseleave', e => {
        if (!lbuttondown && !rbuttondown) {
            view.cursor_x = -1;
            view.cursor_y = -1;
        }
        e.preventDefault();
    });
    document.addEventListener('wheel', e => {
        if (!popup.is_window_open) {
            view.zoom(e.clientX - main_view.offsetLeft, e.clientY - main_view.offsetTop, e.deltaY);
            view.limit_scroll();
            view.update_minimap();
        }
    });
    document.addEventListener('keydown', e => {
        if (is_world_freeze()) {
            return;
        }
        if (!popup.is_window_open) {
            let idx = -1;
            switch (e.key) {
            case 'q': case 'Q':
                idx = 0;
                break;
            case 'b': case 'B':
                idx = 1;
                break;
            case 'r': case 'R':
                idx = 6;
                break;
            case 'c': case 'C':
                idx = 7;
                break;
            case 'i': case 'I':
                idx = 8;
                break;
            case '+':
                if (!popup.is_window_open) {
                    view.zoom(view.client_width / 2, view.client_height / 2, -1);
                }
                break;
            case '-':
                if (!popup.is_window_open) {
                    view.zoom(view.client_width / 2, view.client_height / 2, 1);
                }
                break;
            case 'ArrowUp':
                if (!popup.is_window_open) {
                    view.move_relative(0, 128);
                    view.limit_scroll();
                }
                break;
            case 'ArrowDown':
                if (!popup.is_window_open) {
                    view.move_relative(0, -128);
                    view.limit_scroll();
                }
                break;
            case 'ArrowLeft':
                if (!popup.is_window_open) {
                    view.move_relative(128, 0);
                    view.limit_scroll();
                }
                break;
            case 'ArrowRight':
                if (!popup.is_window_open) {
                    view.move_relative(-128, 0);
                    view.limit_scroll();
                }
                break;
            }
            if (idx >= 0 && (!city.disaster_occurs || city.ruleset === 'micropolis')) {
                current_build_index = idx;
                current_build = build_icon_info[idx];
                update_build_icons();
            }
        }
    });

    document.getElementById('menu-file').addEventListener('click', e => {
        if (is_world_freeze()) {
            return;
        }
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_ok_cancel('ok', 'cancel');
        popup.set_title('file');
        popup.set_layout('list', null);
        let file_menu_items = {
            type: 'single',
            init: 'save_file',
            items: [
                {text: 'save_file'},
                {text: 'goto_menu'},
                {text: 'quit'},
            ],
        };
        popup.set_list_items(file_menu_items);
        popup.open(null, mode => {
            switch (mode) {
            case 'ok':
                switch (popup.get_selected()) { 
                case 'save_file':
                    popup.reset();
                    popup.show_ok_cancel(null, 'download_cancel');
                    popup.set_title('save_file');
                    popup.set_layout('canvas:' + (city.map_size * 2 + 2), 'download');
                    popup.draw_map_q(city);
                    document.getElementById('file-download').textContent = resource.gettext('download');
                    break;
                case 'goto_menu':
                    popup.close();
                    show_title_screen();
                    view.clear_view();
                    break;
                case 'quit':
                    popup.close();
                    show_goodbye();
                    view.clear_view();
                    break;
                }
                break;
            case 'close':
            case 'cancel':
                popup.close();
                break;
            case 'download_cancel':
                popup.reset();
                popup.show_ok_cancel('ok', 'cancel');
                popup.set_title('file');
                popup.set_layout('list', null);
                popup.set_list_items(file_menu_items);
                break;
            }
        });
    });
    document.getElementById('menu-options').addEventListener('click', e => {
        popup.set_back_half_opacity();
        show_options_window();
        popup.open(null, mode => {
            if (mode === 'options_ok') {
                options = popup.get_selected();
                city.auto_bulldoze = options.auto_bulldoze;
                view.color_scheme = options.color_bf_mode;
                popup.color_scheme = options.color_bf_mode;
                update_options();
            }
            popup.close();
        });
    });
    function disaster_occur_message(disaster) {
        city.update_power_grid();
        view.update_power_grid(city);
        view.draw_main(current_speed);

        if (current_speed !== 'normal') {
            current_speed = 'normal';
            update_speed();
        }

        if (options.popup_window) {
            popup.reset();
            popup.set_back_half_opacity();
            popup.show_close_button();
            popup.set_layout('canvas-text', null);
            popup.set_title(disaster);
            popup.set_text_content('disaster_' + disaster);

            view.draw_wallpaper(popup.get_canvas(), null, 'disaster', city.population);
            view.draw_popup_window_picture(popup.get_canvas(), 'disaster');
            popup.open_delay(null, mode => { popup.close(); });
        } else {
            view.show_message_ticker('disaster_' + disaster, false);
        }

        city.update_power_grid_required = true;
        if (city.disaster_occurs) {
            if (city.ruleset === 'tinycity') {
                document.getElementById('indicator-build-icons').style.display = 'none';
            }
        } else {
            view.disaster_alert(-1);
            city.disaster_ticks = -1;
        }
    }
    function tornado_occur() {
        let t = view.tornado;
        if (t.dir >= 0) {
            return null;
        }

        t.z = 0;
        t.d = tornado_time_left;
        t.dir = Math.floor(Math.random() * 8);
        city.disaster_occurs = true;
        city.disaster_ticks = 0;

        for (;;) {
            let x = Math.floor(Math.random() * (city.map_size - 12) + 6);
            let y = Math.floor(Math.random() * (city.map_size - 12) + 6);
            t.x = x * 16 + 8;
            t.y = y * 16 + 8;
            t.dx = DIR8_X[t.dir] * 2;
            t.dy = DIR8_Y[t.dir] * 2;
            let dx = t.x + t.dx * t.d;
            let dy = t.y + t.dy * t.d;
            if (dx >= 0 && dx < city.map_size * 16 && dy >= 0 && dy < city.map_size * 16) {
                t.dust = simulate.disaster_destroy(x, y);
                return {x:x, y:y};
            }
            t.dir++;
            if (t.dir >= 8) {
                t.dir = 0;
            }
        }
    }
    function tornado_move() {
        view.update_vehicle(view.tornado);
        view.tornado.dust = simulate.disaster_destroy(view.tornado.x >> 4, view.tornado.y >> 4);
    }
    function monster_occur() {
        let m = view.monster;
        if (m.dir >= 0) {
            return null;
        }
        city.disaster_occurs = true;
        city.disaster_ticks = 0;

        let x = Math.floor(city.map_size * (Math.random() * 0.8 + 0.1));
        let y = Math.floor(city.map_size * (Math.random() * 0.8 + 0.1));
        let cx = simulate.barycenter_x << 1;
        let cy = simulate.barycenter_y << 1;

        if (Math.abs(x - cx) < Math.abs(y - cy)) {
            m.dir = (y > cy) ? 4 : 0;
            m.d = Math.floor(Math.random() * Math.abs(y - cy)) * 8 + 40;
        } else {
            m.dir = (x > cx) ? 2 : 6;
            m.d = Math.floor(Math.random() * Math.abs(x - cx)) * 8 + 40;
        }
        m.x = x * 16 + 8;
        m.y = y * 16 + 8;
        m.dx = DIR8_X[m.dir] * 2;
        m.dy = DIR8_Y[m.dir] * 2;
        m.dz = 0;
        m.water = !simulate.disaster_destroy(m.x >> 4, m.y >> 4);
        m.z = (m.water ? -8 : 0);
        return {x:x, y:y};
    }
    function monster_move() {
        let m = view.monster;
        view.update_vehicle(m);
        if (m.dx !== 0 || m.dy !== 0) {
            m.walk++;
            if (m.walk >= 4) {
                m.walk = 0;
            }
        } else {
            m.walk = 0;
        }
        m.water = !simulate.disaster_destroy(m.x >> 4, m.y >> 4);
        m.z = (m.water ? -8 : 0);
    }
    function monster_next() {
        let m = view.monster;
        switch (monster_time_left % 3) {
        case 1:
            m.d = Math.floor(Math.random() * 10) * 8 + 40;
            m.fire = false;
            {
                let r = Math.random();
                if (r < 0.5) {
                    if (r < 0.25) {
                        m.dir += 2;
                        if (m.dir >= 8) {
                            m.dir -= 8;
                        }
                    } else {
                        m.dir -= 2;
                        if (m.dir < 0) {
                            m.dir += 8;
                        }
                    }
                }
            }
            for (let i = 0; i < 4; i++) {
                m.dx = DIR8_X[m.dir] * 2;
                m.dy = DIR8_Y[m.dir] * 2;
                let x1 = (m.x + m.dx * m.d * 2) >> 4;
                let y1 = (m.y + m.dy * m.d * 2) >> 4;
                if (x1 >= 0 && x1 < city.map_size && y1 >= 0 && y1 < city.map_size) {
                    break;
                }
                m.dir += 2;
                if (m.dir >= 8) {
                    m.dir -= 8;
                }
            }
            break;
        case 0:
            m.dx = 0;
            m.dy = 0;
            m.d = 5;
            m.fire = false;
            break;
        case 2:
            m.dx = 0;
            m.dy = 0;
            m.d = 5;
            m.fire = true;
            simulate.disaster_monster_fire(m.x >> 4, m.y >> 4, m.dir >> 1);
            break;
        }
    }
    function shipwreck_occur(pos) {
        let x = pos % city.map_size_edge - 1;
        let y = Math.floor(pos / city.map_size_edge) - 1;
        if (pos != null) {
            view.move_position_at(x, y);
        }
        simulate.disaster_vehicle_crash(x, y, true);
        simulate.ship_route = [];
        disaster_occur_message('shipwreck');
    }
    function ufo_move() {
        let u = view.ufo_disaster;

        if (ufo_tick_time === 0) {
            if (simulate.ufo_route.length > 0) {
                ufo_target = simulate.ufo_route.shift();
                u.dir = Math.floor(Math.random() * 8);
                u.cx = ufo_target.x * 16 + 8;
                u.cy = ufo_target.y * 16 + 8;
                ufo_tick_time = 40;
                view.move_position_at(ufo_target.x, ufo_target.y);
            } else {
                ufo_tick_time = -1;
                ufo_target = null;
                u.dir = -1;
            }
        } else {
            ufo_tick_time--;
        }
        u.ticks = ufo_tick_time;
        if (ufo_target != null) {
            if (ufo_tick_time >= 30) {
                let n = (30 - ufo_tick_time) * 32;
                u.x = u.cx + DIR8_X[u.dir] * n;
                u.y = u.cy + DIR8_Y[u.dir] * n;
            } else if (ufo_tick_time >= 10) {
                u.x = u.cx - Math.sin(ufo_tick_time * 0.5) * 8;
                u.y = u.cy - Math.cos(ufo_tick_time * 0.5) * 8;
                if (ufo_tick_time === 20) {
                    simulate.disaster_ufo_attack(ufo_target.x, ufo_target.y, ufo_target.type);
                    view.update_tile_range(city, ufo_target.x - 8, ufo_target.x + 8, ufo_target.y - 8, ufo_target.y + 8);
                }
            } else {
                let n = (10 - ufo_tick_time) * 32;
                u.x = u.cx + DIR8_X[u.dir] * n;
                u.y = u.cy + DIR8_Y[u.dir] * n;
            }
        }
    }
    function disaster_occur(disaster) {
        reset_mouse_drag();

        let pos = null;
        let show_msg = false;
        switch (disaster) {
        case 'fire':
            pos = simulate.disaster_fire();
            if (pos == null) {
                return;
            }
            show_msg = true;
            break;
        case 'flood':
            pos = simulate.disaster_flood();
            if (pos == null) {
                return;
            }
            show_msg = true;
            break;
        case 'airplane_crash':
            if (view.airplane.dir >= 0) {
                view.airplane.dz = -4;
                view.airplane.d = (view.airplane.z + 2) >> 2;
                view.airplane.landing = true;
            }
            return;
        case 'shipwreck':
            if (view.container_ship.dir >= 0) {
                let d = Math.floor(Math.random() * 8);
                simulate.ship_route = [d, d, d, d, 64];
            }
            return;
        case 'tornado':
            show_msg = true;
            tornado_time_left = Math.floor(Math.random() * 150) + 100;
            pos = tornado_occur();
            if (pos == null) {
                return;
            }
            break;
        case 'earthquake':
            earthquake_time_left = Math.floor(city.map_size * (1 + Math.random()) * 0.25);
            break;
        case 'meltdown':
            pos = simulate.disaster_meltdown();
            if (pos == null) {
                return;
            }
            show_msg = true;
            break;
        case 'monster':
            show_msg = true;
            pos = monster_occur();
            if (pos == null) {
                return;
            }
            monster_time_left = (Math.floor(Math.random() * 3) + 4) * 3 + 1;
            break;
        case 'ufo':
            if (!simulate.disaster_ufo()) {
                return;
            }
            ufo_tick_time = 0;
            break;
        }
        if (city.ruleset === 'tinycity' && current_build_index !== 0) {
            current_build_index = 0;
            current_build = build_icon_info[current_build_index];
            update_build_icons();
        }
        if (city.ruleset === 'tinycity') {
            document.getElementById('indicator-build-icons').style.display = 'none';
        }
        view.disaster_alert(0);

        if (show_msg) {
            if (pos != null) {
                view.move_position_at(pos.x, pos.y);
            }
            disaster_occur_message(disaster);
        }
    }
    document.getElementById('menu-disaster').addEventListener('click', e => {
        if (is_world_freeze()) {
            return;
        }
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_ok_cancel('ok', 'cancel');
        popup.set_title('disaster');
        popup.set_layout('list', null);
        let list = [
            {text: 'fire'},
            {text: 'flood'},
            {text: 'airplane_crash'},
            {text: 'shipwreck'},
            {text: 'tornado'},
            {text: 'earthquake'},
            {text: 'monster'},
            {text: 'ufo'},
        ];
        if (city.ruleset === 'micropolis') {
            list.push({text: 'meltdown'});
        }
        popup.set_list_items({
            type: 'single',
            items: list,
            init: 'fire',
        });
        popup.open(null, mode => {
            popup.close();
            if (mode === 'ok') {
                disaster_occur(popup.get_selected());
            }
        });
    });
    function show_bankrupt() {
        popup.show_close_button();
        popup.set_layout('canvas-text', null);
        popup.set_title('bankrupt');
        popup.set_text_content('msg_bankrupt');
        view.draw_wallpaper_room(popup.get_canvas(), null, null);
        view.draw_popup_window_picture('bankrupt');

        popup.open_delay(null, mode => {
            popup.close();
            show_title_screen();
            view.clear_view();
        });
    }
    function show_budget(draft) {
        reset_mouse_drag();
        popup.reset();
        popup.set_back_half_opacity();

        let monthly = simulate.get_month_budget(draft);
        let month_left = draft ? 12 - city.month : 0;

        let tax_collected = 0;
        let traffic_allocated = 0;
        let police_allocated = 0;
        let fire_allocated = 0;
        let debt_payment = 0;
        let fiscal_year = city.year;

        if (draft) {
            popup.show_close_button();
            fiscal_year++;
        }
        if (city.debt_payment.length >= 2 && city.debt_payment[0] === fiscal_year) {
            debt_payment = city.debt_payment[1];
            if (!draft) {
                city.debt_payment.shift();
                city.debt_payment.shift();
            }
        }
        if (!draft && city.funds !== 'infinity') {
            if (city.ruleset === 'tinycity') {
                if (calc_total() < BAKNRUPT_LIMIT) {
                    show_bankrupt();
                    return;
                }
            } else {
                if (city.funds + city.tax_collected + city.special_income - debt_payment < 0) {
                    show_bankrupt();
                    return;
                }
            }
        }
        popup.set_title_raw(resource.yearstr(fiscal_year) + ' ' + resource.gettext('budget_draft'));

        function calc_total() {
            if (city.funds === 'infinity') {
                return city.funds;
            } else {
                return city.funds + tax_collected + city.special_income - traffic_allocated - police_allocated - fire_allocated - debt_payment;
            }
        }
        function update() {
            tax_collected = city.tax_collected + month_left * Math.round(monthly.tax * city.tax_rate);
            if (city.ruleset === 'tinycity') {
                traffic_allocated = city.traffic_cost + month_left * Math.round(monthly.traffic * city.traffic_funds_term / 1200);
                police_allocated = city.police_cost + month_left * Math.round(monthly.police * city.police_funds_term / 10);
                fire_allocated   = city.fire_cost + month_left * Math.round(monthly.fire * city.fire_funds_term / 10);
            } else {
                traffic_allocated = Math.round(city.traffic_cost * city.traffic_funds / 100);
                police_allocated = Math.round(city.police_cost * city.police_funds / 100);
                fire_allocated   = Math.round(city.fire_cost * city.fire_funds / 100);
            }
            popup.svg_list_values.tax_collected.textContent = String(tax_collected);
            popup.svg_list_values.traffic_funds.textContent = String(traffic_allocated);
            popup.svg_list_values.police_funds.textContent  = String(police_allocated);
            popup.svg_list_values.fire_funds.textContent    = String(fire_allocated);
            let current_funds = calc_total();
            popup.svg_list_values.next_funds.textContent    = String(calc_total());
            if (current_funds >= 0) {
                popup.svg_list_values.next_funds.setAttribute('style', 'fill:#000000');
            } else {
                popup.svg_list_values.next_funds.setAttribute('style', 'fill:#ff0000');
            }
        }

        popup.set_layout('svg', null);
        popup.set_svg_list(16, 100, 380, [
            {title:'current_funds', val:city.funds},
            {separator:true},
            {title:'tax', val:0, id:'tax_collected'},
            {title:'special_income', val:city.special_income},
            {separator:true},
            {title:'traffic_funds', val:0, id:'traffic_funds'},
            {title:'police_funds',  val:0, id:'police_funds'},
            {title:'fire_funds',    val:0, id:'fire_funds'},
            {title:(city.ruleset === 'tinycity' ? 'bond' : 'debt'), val:debt_payment},
            {separator:true},
            {title:(draft ? 'estimeted_funds' : 'next_funds'), val:0, id:'next_funds'},
        ]);
        popup.set_svg_list(80, 100, 520, [
            {val:city.tax_rate, unit:'%', format:'input', id:'tax_rate_input', on_down:e => {
                if (city.tax_rate > 0) {
                    city.tax_rate--;
                    popup.svg_list_values.tax_rate_input.textContent = String(city.tax_rate);
                    update();
                }
            }, on_up:e => {
                if (city.tax_rate < 20) {
                    city.tax_rate++;
                    popup.svg_list_values.tax_rate_input.textContent = String(city.tax_rate);
                    update();
                }
            }},
            {},
            {},
            {val:city.traffic_funds, unit:'%', format:'input', id:'traffic_funds_input', on_down:e => {
                if (city.traffic_funds > 0) {
                    city.traffic_funds -= 10;
                    popup.svg_list_values.traffic_funds_input.textContent = String(city.traffic_funds);
                    update();
                }
            }, on_up:e => {
                if (city.traffic_funds < 100) {
                    city.traffic_funds += 10;
                    popup.svg_list_values.traffic_funds_input.textContent = String(city.traffic_funds);
                    update();
                }
            }},
            {val:city.police_funds, unit:'%', format:'input', id:'police_funds_input', on_down:e => {
                if (city.police_funds > 0) {
                    city.police_funds -= 10;
                    popup.svg_list_values.police_funds_input.textContent = String(city.police_funds);
                    update();
                }
            }, on_up:e => {
                if (city.police_funds < 100) {
                    city.police_funds += 10;
                    popup.svg_list_values.police_funds_input.textContent = String(city.police_funds);
                    update();
                }
            }},
            {val:city.fire_funds, unit:'%', format:'input', id:'fire_funds_input', on_down:e => {
                if (city.fire_funds > 0) {
                    city.fire_funds -= 10;
                    popup.svg_list_values.fire_funds_input.textContent = String(city.fire_funds);
                    update();
                }
            }, on_up:e => {
                if (city.fire_funds < 100) {
                    city.fire_funds += 10;
                    popup.svg_list_values.fire_funds_input.textContent = String(city.fire_funds);
                    update();
                }
            }},
        ]);
        update();

        if (draft) {
            popup.open(() => {
            }, mode => {
                popup.close();
            });
        } else {
            popup.add_svg_button(440, 320, 120, 36, 'ok', true);
            popup.open_delay(() => {
            }, mode => {
                if (mode === 'ok') {
                    let funds = calc_total();
                    if (funds !== 'infinity') {
                        if (city.ruleset !== 'tinycity' && funds < 0) {
                            return;
                        }
                        city.funds = funds;
                    }
                    if (city.ruleset === 'micropolis') {
                        city.traffic_funds_term = city.traffic_funds;
                        city.police_funds_term  = city.police_funds;
                        city.fire_funds_term    = city.fire_funds;
                    }
                    city.hidden_assets += Math.round(city.tax_collected / 100) + Math.round(city.special_income / 10);
                    popup.close();
                    simulate.reset_budget();
                    simulate.update_month_budget();
                    update_indicator();
                }
            });
        }
    }
    function show_budget_ticker() {
        let budget = city.get_budget(false);
        let income = budget.tax + budget.special_income;
        let expense = 0;
        if (city.ruleset === 'tinycity') {
            expense += budget.traffic;
            expense += budget.police;
            expense += budget.fire;
        } else {
            expense += Math.round(budget.traffic * city.traffic_funds / 100);
            expense += Math.round(budget.police * city.police_funds / 100);
            expense += Math.round(budget.fire * city.fire_funds / 100);
        }
        let funds = city.funds + income - expense;
        if (funds < 0) {
            show_budget(false);
        } else {
            let balance = income + expense;
            let msg = resource.yearstr(city.year) + " | " + resource.gettext('incomes') + ": " + income + " / " + resource.gettext('expenses') + ": " + expense + " = ";
            if (balance > 0) {
                msg += "+" + balance;
            } else if (balance === 0) {
                msg += "±0";
            } else {
                msg += balance;
            }
            if (city.funds !== 'infinity') {
                view.show_message_ticker_raw(msg, true);
            }
            city.funds = funds;
            city.hidden_assets += Math.round(budget.tax / 100) + Math.round(budget.special_income / 10);
        }
    }
    document.getElementById('menu-budget').addEventListener('click', e => {
        show_budget(true);
    });
    document.getElementById('menu-debt').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title(city.ruleset === 'tinycity' ? 'bond' : 'loan');
        popup.set_layout('svg', null);

        let year_complete = 'none';
        let balance = 0;
        let interest5 = 100;
        let interest10 = 100;

        function calc_payment() {
            year_complete = 'none';
            balance = 0;
            if (city.debt_payment.length >= 2) {
                year_complete = city.debt_payment[city.debt_payment.length - 2];
                for (let i = 1; i < city.debt_payment.length; i += 2) {
                    balance += city.debt_payment[i];
                }
            }
        }
        function show_bond() {
            calc_payment();
            if (city.assessed_value >= 10000) {
                let rate = balance / city.assessed_value;
                interest5 = Math.floor(5 + rate * 100);
                interest10 = Math.floor(12 + rate * 250);
            } else {
                interest5 = 100;
                interest10 = 100;
            }

            popup.add_svg_button(72, 8, 368, 36, 'bond_5year', interest5 <= 50);
            popup.add_svg_button(72, 50, 368, 36, 'bond_10year', interest10 <= 50);
            if (interest5 > 50) {
                interest5 = 0;
            }
            if (interest10 > 50) {
                interest10 = 0;
            }
            popup.set_svg_list(32, 450, 570, [
                {title: 'interest', val:interest5, unit:'%'},
            ]);
            popup.set_svg_list(76, 450, 570, [
                {title: 'interest', val:interest10, unit:'%'},
            ]);
            popup.set_svg_list(120, 80, 440, [
                {title:'payment_complete', val:year_complete},
                {title:'payment_balance', val:balance},
            ]);

            let list = [];
            let j = 0;
            for (let i = 0; i < 6 && i * 2 < city.debt_payment.length; i++) {
                list.push({val:resource.yearstr(city.debt_payment[i * 2]), id:'year' + i, format:'raw'});
            }
            popup.set_svg_list(196, 72, 280, list);

            list = [];
            j = 0;
            for (let i = 0; i < 6 && i * 2 < city.debt_payment.length; i++) {
                list.push({val:'$' + city.debt_payment[i * 2 + 1], id:'amount' + i, format:'raw'});
            }
            popup.set_svg_list(196, 72, 440, list);
        }
        function show_loan_debt() {
            calc_payment();
            popup.add_svg_button(80, 8, 360, 36, 'loan_10000', city.debt_payment.length === 0);
            popup.set_svg_list(72, 80, 380, [
                {title:'msg_loan'},
            ]);
            popup.set_svg_list(120, 80, 440, [
                {title:'payment_complete', val:year_complete},
                {title:'payment_balance', val:balance},
            ]);
        }
        function update_fund() {
        }
        function insert_debt(year, amount) {
            let i;
            for (i = city.debt_payment.length; i >= 2; i -= 2) {
                let y = city.debt_payment[i - 2];
                if (y === year) {
                    city.debt_payment[i - 1] += amount;
                    return;
                }
                if (y < year) {
                    break;
                }
            }
            city.debt_payment.splice(i, 0, year, amount);
        }

        if (city.ruleset === 'tinycity') {
            show_bond();
        } else {
            show_loan_debt();
        }

        popup.open(null, mode => {
            switch (mode) {
            case 'loan_10000':
                for (let i = 0; i < 21; i++) {
                    city.debt_payment.push(city.year + i + 1);
                    city.debt_payment.push(500);
                }
                city.funds += 10000;
                popup.clear_svg();
                show_loan_debt();
                update_indicator();
                break;
            case 'bond_5year':
                insert_debt(city.year + 5, 20 * (100 + interest5));
                city.funds += 2000;
                popup.clear_svg();
                show_bond();
                update_indicator();
                break;
            case 'bond_10year':
                insert_debt(city.year + 10, 30 * (100 + interest10));
                city.funds += 3000;
                popup.clear_svg();
                show_bond();
                update_indicator();
                break;
            case 'close':
                popup.close();
                break;
            }
        });
    });
    document.getElementById('menu-map').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title('map');
        popup.set_layout('map:' + (city.map_size * 2 + 2), 'list');
        popup.set_list_items({
            type: 'single',
            init: map_type_selected,
            items: [
                //{text: 'debug', text_raw:'Debug'},
                {text: 'all_zones'},
                {text: 'power_grid'},
                {text: 'pop_density'},
                {text: 'pop_growth'},
                {text: 'transportation'},
                {text: 'traffic_volume'},
                {text: 'crime'},
                {text: 'pollution'},
                {text: 'land_value'},
                {text: 'police_cov'},
                {text: 'fire_cov'},
                {text: 'disaster'},
            ],
        });
        popup.open(() => {
            map_type_selected = popup.get_selected();
            switch (map_type_selected) {
            case 'all_zones':
                popup.draw_map_base(city, true);
                popup.set_map_legand([
                    {text: 'r_zone', color: '#00E000', text_color: '#000000'},
                    {text: 'c_zone', color: '#6060FF', text_color: '#000000'},
                    {text: 'i_zone', color: '#FFA000', text_color: '#000000'},
                ]);
                popup.show_vehicle_position(city, view);
                break;
            case 'power_grid':
                popup.draw_map_base(city, false);
                popup.draw_map_power(city);
                popup.set_map_legand([
                    {text: 'power_plants', color: (popup.color_scheme ? '#FFFFFF' : '#FF0000'), text_color: '#000000' },
                    {text: 'power_supplied', color: (popup.color_scheme ? '#D0D0D0' : '#FF8000'), text_color: '#000000'},
                    {text: 'power_outage', color: (popup.color_scheme ? '#404040' : '#008000'), text_color: '#FFFFFF'},
                ]);
                break;
            case 'pop_density':
                popup.draw_map_base(city, false);
                popup.draw_map_data2(city, city.tile_population, 2);
                popup.set_legand_heatmap(true);
                break;
            case 'pop_growth':
                popup.draw_map_base(city, false);
                popup.draw_map_data8(city, city.tile_grow_pops);
                popup.set_legand_heatmap(false);
                break;
            case 'transportation':
                popup.draw_map_base(city, false);
                popup.draw_map_transport(city);
                popup.set_map_legand([
                    {text: 'road', color: '#0000FF', text_color: '#FFFFFF'},
                    {text: 'railroad', color: '#FFFF00', text_color: '#000000'},
                    {text: 'station', color: '#A0A000', text_color: '#000000'},
                ]);
                break;
            case 'traffic_volume':
                popup.draw_map_base(city, false);
                popup.draw_map_traffic(city);
                popup.set_legand_heatmap(true);
                break;
            case 'crime':
                popup.draw_map_base(city, false);
                popup.draw_map_data2(city, city.tile_crime, 2);
                popup.set_legand_heatmap(true);
                break;
            case 'pollution':
                popup.draw_map_base(city, false);
                popup.draw_map_data2(city, city.tile_pollution, 2);
                popup.set_legand_heatmap(true);
                break;
            case 'land_value':
                popup.draw_map_base(city, false);
                popup.draw_map_data2(city, city.tile_land_value, 2);
                popup.set_legand_heatmap(true);
                break;
            case 'police_cov':
                popup.draw_map_base(city, false);
                popup.draw_map_data2(city, city.tile_police_d, 2);
                popup.set_legand_heatmap(true);
                break;
            case 'fire_cov':
                popup.draw_map_base(city, false);
                popup.draw_map_data2(city, city.tile_fire_d, 2);
                popup.set_legand_heatmap(true);
                break;
            case 'disaster':
                popup.draw_map_base(city, false);
                popup.draw_map_disaster(city);
                {
                    let legand = [
                        {text: 'fire', color: '#FF0000', text_color: '#000000'},
                        {text: 'flood', color: '#0000FF', text_color: '#FFFFFF'},
                    ];
                    if (city.ruleset === 'micropolis') {
                        legand.push({text: 'radioactivity', color: '#FFFF00', text_color: '#000000'});
                    }
                    popup.set_map_legand(legand);
                }
                popup.show_disaster_position(city, view);
                break;
            //case 'debug':
            //    popup.draw_map_base(city, false);
            //    simulate.debug(popup.get_canvas());
            //    break;
            }
        }, mode => {
            popup.close();
        });
        popup.invoke();
    });
    document.getElementById('menu-graph').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title('graph');
        popup.set_layout('svg', 'list');
        popup.set_list_items({
            type: 'multi',
            init: graph_selected,
            items: [
                {text: 'r_zones', color:'#00a000'},
                {text: 'c_zones', color:'#0000ff'},
                {text: 'i_zones', color:'#a0a000'},
                {text: 'crime', color:'#000000'},
                {text: 'pollution', color:'#a000a0'},
                {text: 'land_value', color:'#008080'},
            ],
        });
        popup.set_svg_graph(city);
        popup.open(() => {
            let selected = popup.get_selected();
            popup.set_svg_item_visible('r_zones', selected.r_zones);
            popup.set_svg_item_visible('c_zones', selected.c_zones);
            popup.set_svg_item_visible('i_zones', selected.i_zones);
            popup.set_svg_item_visible('crime', selected.crime);
            popup.set_svg_item_visible('pollution', selected.pollution);
            popup.set_svg_item_visible('land_value', selected.land_value);
            graph_selected = selected;
        }, mode => {
            popup.close();
        });
        popup.invoke();
    });
    document.getElementById('menu-evaluation').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title('evaluation');
        popup.set_layout('svg', null);

        let opinion;
        if (city.base_score >= 0) {
            let support_rate = Math.round(city.base_score * 0.08) + 10;
            opinion = [
                {caption:'public_opinion'},
                {title:'msg_support_rate'},
                {title:'yes', val:support_rate, unit:'%'},
                {title:'no', val:100 - support_rate, unit:'%'},
                {},
                {title:'msg_whats_problems'},
            ];
            for (let i = 0; i < 4; i++) {
                let item = city.problems_worst[i];
                if (item.val > 0) {
                    opinion.push(item);
                }
            }
        } else {
            opinion = [
                {caption:'public_opinion'},
                {},
                {title:'not_available'},
            ];
        }
        let score = (city.base_score >= 0 ? Math.floor(city.population * city.base_score / 1000) : 0);

        popup.set_svg_list(48, 32, 260, opinion);
        popup.set_svg_list(48, 380, 600, [
            {title:'population', val:city.population},
            {title:'growth_last_year', val:city.population - city.prev_population, format:'+'},
            {title:'gdp', val:city.month_gdp},
            {title:'assessed_value', val:city.assessed_value},
            {},
            {title:'score', val:score},
            {title:'difficulty', val:city.difficulty},
            {title:'city_scale', val:get_city_category(city.population)},
            {title:'ruleset', val:city.ruleset},
        ]);
        popup.open(null, mode => {
            popup.close();
        });
    });
    document.getElementById('menu-statistics').addEventListener('click', e => {
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title('statistics');
        popup.set_layout('svg', null);

        let st = city.get_statistics();
        let zone_total = st.r_zone + st.c_zone + st.i_zone;
        popup.set_svg_list(32, 32, 180, [
            {title:'r_zones', val:st.r_zone},
            {title:'c_zones', val:st.c_zone},
            {title:'i_zones', val:st.i_zone},
            {title:'total', val:zone_total},
            {title:'developed', val:st.developed},
            {title:'top_develop', val:st.top, format:'raw'},
        ]);
        popup.set_svg_list(32, 32, 240, [
            {val:(zone_total > 0 ? 1000 * st.r_zone / zone_total : 0), unit:'%', format:1},
            {val:(zone_total > 0 ? 1000 * st.c_zone / zone_total : 0), unit:'%', format:1},
            {val:(zone_total > 0 ? 1000 * st.i_zone / zone_total : 0), unit:'%', format:1},
        ]);
        popup.set_svg_list(256, 32, 240, [
            {title:'road', val:(st.road / 2), unit:'km', format:1},
            {title:'railroad', val:(st.rail / 2), unit:'km', format:1},
            {title:'wire', val:(st.wire / 2), unit:'km', format:1},
            {title:'stations', val:st.station},
        ]);
        popup.set_svg_list(32, 300, 560, [
            {title:'power_plants', val:st.power_plant},
            {title:'max_output', val:st.power_capa, unit:'MW', format:1},
            {title:'power_req', val:st.power_req, unit:'MW', format:1},
        ]);
        popup.set_svg_list(128, 300, 450, [
            {title:'police_depts', val:st.police_dept},
            {title:'fire_depts', val:st.fire_dept},
        ]);
        popup.set_svg_list(128, 470, 590, [
            {title:'hospitals', val:st.hospital},
            {title:'schools', val:st.school},
        ]);
        popup.set_svg_list(224, 300, 560, [
            {title:'land', val:st.land * 2.5, unit:'km²', format:3},
            {val:(1000 * st.land / (st.land + st.water)), unit:'%', format:1},
            {title:'land_clear', val:st.clear * 2.5, unit:'km²', format:3},
            {title:'woods', val:st.woods * 2.5, unit:'km²', format:3},
            {title:'water_area', val:st.water * 2.5, unit:'km²', format:3},
        ]);
        popup.open(null, mode => {
            popup.close();
        });
    });
    document.getElementById('menu-election').addEventListener('click', e => {
        if (city.election == null) {
            return;
        }
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_title_raw(resource.yearstr(city.election.year) + " " + resource.gettext('election'));
        popup.set_layout('svg', null);

        let list = [{caption: 'commitment'}];
        for (let i = 0; i < city.election.cond.length - 1; i += 2) {
            let c = city.election.cond[i];
            let n = city.election.cond[i + 1];
            switch (c) {
            case 'population':
                list.push({raw_text: resource.format('cond_population', {pops: n}), val: city.population});
                break;
            case 'base_score':
                if (city.base_score >= 0) {
                    list.push({raw_text: resource.format('cond_support_rate', {rate: Math.round(n * 0.08) + 10}), val: Math.round(city.base_score * 0.08) + 10, unit:'%'});
                } else {
                    list.push({raw_text: resource.format('cond_support_rate', {rate: Math.round(n * 0.08) + 10}), val: 'N/A', format: 'raw'});
                }
                break;
            case 'traffic_jam':
            case 'crime':
            case 'pollution':
                if (city.base_score >= 0) {
                    list.push({raw_text: resource.format('cond_probrems', {probrem: c, rate: n}), val: city.problems[c], unit:'%'});
                } else {
                    list.push({raw_text: resource.format('cond_probrems', {probrem: c, rate: n}), val: 'N/A', format: 'raw'});
                }
                break;
            }
        }

        popup.set_svg_list(48, 72, 510, list);
        popup.open(null, mode => {
            popup.close();
        });
    });
    document.getElementById('button-speed-pause').addEventListener('click', e => {
        current_speed = 'pause';
        update_speed();
    });
    document.getElementById('button-speed-normal').addEventListener('click', e => {
        current_speed = 'normal';
        update_speed();
    });
    document.getElementById('button-speed-fast').addEventListener('click', e => {
        if (!city.disaster_occurs) {
            current_speed = 'fast';
            update_speed();
        }
    });
    document.getElementById('minimap-cw').addEventListener('click', e => {
        city.rotate_cw();
        view.rotate_cw();
        simulate.rotate_cw();
        view.update_all(city);
        update_minimap();
    });
    document.getElementById('minimap-ccw').addEventListener('click', e => {
        city.rotate_ccw();
        view.rotate_ccw();
        simulate.rotate_ccw();
        view.update_all(city);
        update_minimap();
    });
    document.getElementById('minimap-sw').addEventListener('click', e => {
        view.opaque_buildings = !view.opaque_buildings;
        document.getElementById('minimap-sw-back').setAttribute('style', 'fill:' + (view.opaque_buildings ? '#ffffff' : '#808080'));
    });
    function show_city_file_info(json, from_url) {
        city_tmp = new City(json);
        popup.reset();
        popup.set_title('load_file');
        popup.show_ok_cancel('file_ok', from_url ? null : 'file_cancel');
        popup.set_layout('canvas:' + (city_tmp.map_size * 2 + 2), 'svg');
        popup.draw_map_q(city_tmp);

        let list = [
            {raw_text: resource.datestr(city_tmp.year, city_tmp.month)},
            {raw_text: city_tmp.city_name},
            {},
            {title: 'funds', val: city_tmp.funds},
            {title: 'population', val: city_tmp.population},
            {title: 'ruleset', val: city_tmp.ruleset},
            {title: 'difficulty', val: city_tmp.difficulty},
        ];
        if (city_tmp.election != null) {
            list.push({title: 'election', val: resource.datestr(city_tmp.election.year, 3), format: 'raw'});
        }
        popup.set_svg_list(32, 32, 260, list);
    }
    function show_error_window(message) {
        popup.reset();
        popup.set_title_raw("Error");
        popup.set_layout('text', null);
        popup.set_text_content_raw(message);
    }
    popup.callback_readfile = (file => {
        let fr = new FileReader();
        fr.addEventListener('load', e => {
            try {
                show_city_file_info(JSON.parse(e.target.result), false);
            } catch (e) {
                // TODO
                window.alert(e);
            }
        });
        fr.readAsText(file);
    });
    document.getElementById('file-download').addEventListener('click', e => {
        city.flood_time_left = simulate.flood_time_left;
        if (view.tornado.dir >= 0) {
            let t = view.tornado;
            city.tornado = {
                dir: t.dir,
                x:   t.x,
                y:   t.y,
                d:   t.d,
                dx:  t.dx,
                dy:  t.dy,
                left:tornado_time_left,
            };
        } else {
            city.tornado = null;
        }
        if (view.monster.dir >= 0) {
            let m = view.monster;
            city.monster = {
                dir: m.dir,
                x:   m.x,
                y:   m.y,
                d:   m.d,
                dx:  m.dx,
                dy:  m.dy,
                left:monster_time_left,
            };
        } else {
            city.monster = null;
        }

        let json = city.to_json();
        let blob = new Blob([JSON.stringify(json)], {type: "application/json"});

        let a = e.target;
        a.href = URL.createObjectURL(blob);
    });

    document.addEventListener('contextmenu', e => {
        e.preventDefault();
    });
    window.addEventListener('beforeunload', e => {
        if (current_speed !== 'title') {
            e.returnValue = 'Close anyway ?';
        }
    });

    function show_election_result() {
        let votes = city.population >> 2;
        let rate = 1000000;
        let win = true;
        let msg;

        if (city.base_score >= 0) {
            for (let i = 0; i < city.election.cond.length - 1; i += 2) {
                let c = city.election.cond[i];
                let n = city.election.cond[i + 1];
                switch (c) {
                case 'population':
                    if (city.population < n) {
                        win = false;
                    }
                    {
                        let r = (city.population + 10000) / (n + 10000);
                        if (rate > r) {
                            rate = r;
                        }
                    }
                    break;
                case 'base_score':
                    if (city.base_score < n) {
                        win = false;
                    }
                    {
                        let r = (city.base_score + 500) / (n + 500);
                        if (rate > r) {
                            rate = r;
                        }
                    }
                    break;
                case 'traffic_jam':
                case 'crime':
                case 'pollution':
                    if (city.problems[c] > n) {
                        win = false;
                    }
                    {
                        let r = (n + 20) / (city.problems[c] + 20);
                        if (rate > r) {
                            rate = r;
                        }
                    }
                    break;
                }
            }
            if (rate < 0.2) {
                rate = 0.2;
            } else if (rate > 1.8) {
                rate = 1.8;
            }
            let votes1 = Math.round(votes * rate);
            let votes2 = Math.round(votes * (2 - rate));
            if (win) {
                if (votes1 <= votes2) {
                    votes1 = votes2 + 1;
                }
                msg = resource.gettext('msg_elect_win') + "\n" + resource.format('msg_elect_result', {votes1: votes1, votes2: votes2});
            } else {
                if (votes1 >= votes2) {
                    votes2 = votes1 + 1;
                }
                msg = resource.gettext('msg_elect_lose') + "\n" + resource.format('msg_elect_result', {votes1: votes1, votes2: votes2});
            }
        } else {
            msg = resource.gettext('msg_elect_lose');
        }
        reset_mouse_drag();
        popup.reset();
        popup.set_back_half_opacity();
        popup.show_close_button();
        popup.set_layout('canvas-text', null);
        popup.set_title('election_result');
        popup.set_text_content_raw(msg);
        view.draw_wallpaper(popup.get_canvas(), null, 'day', city.population);
        view.draw_popup_window_picture(popup.get_canvas(), win ? 'election_win' : 'election_lose');

        popup.open_delay(null, mode => {
            popup.close();
            if (win) {
                document.getElementById('menu-election').style.display = 'none';
            } else {
                show_title_screen();
                view.clear_view();
            }
        });
    }

    function airplane_takeoff() {
        let a = view.airplane;
        a.x = (simulate.airport_active_x - 1) * 16;
        a.y = (simulate.airport_active_y - 1) * 16;
        a.z = 0;

        if (Math.random() < 0.5) {
            a.dir = (a.x < city.map_size * 8) ? 6 : 2;
        } else {
            a.dir = (a.y < city.map_size * 8) ? 0 : 4;
        }
        a.dx = DIR8_X[a.dir] * 4;
        a.dy = DIR8_Y[a.dir] * 4;
        a.dz = 2;
        a.d = 40;
    }
    function airplane_takeoff_next() {
        let a = view.airplane;
        a.d = (Math.floor(Math.random() * 48) + 32) * 4;

        if (a.dz > 0) {
            a.dz = 0;
        } else {
            if (Math.random() < 0.5) {
                a.dir--;
                if (a.dir < 0) {
                    a.dir = 7;
                }
            } else {
                a.dir++;
                if (a.dir >= 8) {
                    a.dir = 0;
                }
            }
            a.dx = DIR8_X[a.dir] * 4;
            a.dy = DIR8_Y[a.dir] * 4;
            airplane_check_frameout(a);
        }
    }
    function airplane_arrival() {
        let a = view.airplane;
        a.x = (simulate.airport_active_x - 1) * 16;
        a.y = (simulate.airport_active_y - 1) * 16;
        a.z = 80;
        if (Math.random() < 0.5) {
            if (a.x < city.map_size * 8) {
                a.dir = 2;
                a.d = Math.floor((city.map_size * 16 - a.x) / 4) - 40;
                a.x = city.map_size * 16;
            } else {
                a.dir = 6;
                a.d = Math.floor(a.x / 4) - 40;
                a.x = 0;
            }
        } else {
            if (a.y < city.map_size * 8) {
                a.dir = 4;
                a.d = Math.floor((city.map_size * 16 - a.y) / 4) - 40;
                a.y = city.map_size * 16;
            } else {
                a.dir = 0;
                a.d = Math.floor(a.y / 4) - 40;
                a.y = 0;
            }
        }
        a.dx = DIR8_X[a.dir] * 4;
        a.dy = DIR8_Y[a.dir] * 4;
        a.dz = 0;
    }
    function airplane_arrival_next() {
        let a = view.airplane;
        let x = (a.x + a.dx * 40) >> 4;
        let y = (a.y + a.dy * 40) >> 4;
        if (x >= 0 && x < city.map_size && y >= 0 && y < city.map_size) {
            if ((city.tile_data[1 + x + (1 + y) * city.map_size_edge] & ~F_CENTER) === M_AIRPORT) {
                a.dz = -2;
                a.d = 40;
                a.landing = true;
                return;
            }
        }
        a.d = 1000;
        airplane_check_frameout(a);
    }
    function airplane_check_frameout(a) {
        if (a.x + a.dx * a.d < 0) {
            a.d = Math.floor(-a.x / a.dx);
            a.landing = true;
        } else if (a.x + a.dx * a.d >= city.map_size * 16) {
            a.d = Math.floor((city.map_size * 16 - a.x) / a.dx);
            a.landing = true;
        }
        if (a.y + a.dy * a.d < 0) {
            let d = Math.floor(-a.y / a.dy);
            if (a.d > d) a.d = d;
            a.landing = true;
        } else if (a.y + a.dy * a.d >= city.map_size * 16) {
            let d = Math.floor((city.map_size * 16 - a.y) / a.dy);
            if (a.d > d) a.d = d;
            a.landing = true;
        }
    }
    function airplane_landing() {
        let a = view.airplane;
        a.landing = false;
        a.dir = -1;
        a.d = -1;
        simulate.airplane_departs = false;
        simulate.airport_active_x = -1;
        is_airplane_arrival = !is_airplane_arrival;

        if (a.z <= 0) {
            let x = a.x >> 4;
            let y = a.y >> 4;
            if (x >= 0 && x < city.map_size && y >= 0 && y < city.map_size) {
                if ((city.tile_data[1 + x + (1 + y) * city.map_size_edge] & ~F_CENTER) !== M_AIRPORT) {
                    simulate.disaster_vehicle_crash(x, y, false);
                    disaster_occur_message('airplane_crash');
                }
            }
        }
    }
    function helicopter_takeoff() {
        let h = view.helicopter;
        h.dir = 0;
        h.x = (simulate.airport_active_x - 1) * 16;
        h.y = (simulate.airport_active_y - 1) * 16;
        h.z = 0;
        h.dx = 0;
        h.dy = 0;
        h.dz = 2;
        if (city.difficulty === 'master') {
            h.d = 40;
        } else {
            h.d = 20;
        }
    }
    function helicopter_next() {
        let h = view.helicopter;
        h.dir = Math.floor(Math.random() * 5) - 2;
        if (h.dir < 0) {
            h.dir += 8;
        } else if (h.dir >= 8) {
            h.dir -= 8;
        }
        h.dz = 0;

        for (;;) {
            h.dx = DIR8_X[h.dir] * 2;
            h.dy = DIR8_Y[h.dir] * 2;
            h.d = (Math.floor(Math.random() * 48) + 32) * 8;
            let dx = h.x + h.dx * h.d;
            let dy = h.y + h.dy * h.d;
            if (dx >= 0 && dx < city.map_size * 16 && dy >= 0 && dy < city.map_size * 16) {
                break;
            }
            h.dir++;
            if (h.dir >= 8) {
                h.dir = 0;
            }
        }
    }
    function train_departs() {
        let p = city.station_exit(simulate.station_active_pos);
        if (p != null) {
            for (let i = 0; i < view.train.length; i++) {
                let t = view.train[i];
                t.d1 = p.dir;
                t.d2 = -1 - i;
                t.x = (p.pos % city.map_size_edge) - 1;
                t.y = Math.floor(p.pos / city.map_size_edge) - 1;
                view.train_ticks = 0;
            }
        }
    }
    function train_next() {
        function is_rail(x, y) {
            return (city.tile_data[1 + x + (1 + y) * city.map_size_edge] & M_RAIL_WT) !== 0;
        }
        function is_station(x, y) {
            let t = city.tile_data[1 + x + (1 + y) * city.map_size_edge];
            return t === M_STATION || t === M_GOODS_ST || t === M_TERM_STN;
        }

        let count = 0;
        let reverse = false;
        let prev_d = -1;
        for (let i = 0; i < view.train.length; i++) {
            let t = view.train[i];
            if (t.d1 >= 0) {
                if (t.d2 < 0 && t.d2 !== -1 - view.train_ticks) {
                    continue;
                }
                t.x += DIR4_X[t.d1];
                t.y += DIR4_Y[t.d1];
                if (is_station(t.x, t.y)) {
                    t.d1 = -1;
                    t.d2 = -1;
                    continue;
                }
                t.d2 = t.d1;

                let d1 = (t.d1 < 1 ? 3 : t.d1 - 1);
                let d2 = (t.d1 < 3 ? t.d1 + 1 : 0);

                if (prev_d >= 0) {
                    t.d2 = t.d1;
                    t.d1 = prev_d;
                    prev_d = t.d2;
                } else {
                    if (is_rail(t.x + DIR4_X[d1], t.y + DIR4_Y[d1])) {
                        t.d1 = d1;
                    } else if (is_rail(t.x + DIR4_X[t.d1], t.y + DIR4_Y[t.d1])) {
                    } else if (is_rail(t.x + DIR4_X[d2], t.y + DIR4_Y[d2])) {
                        t.d1 = d2;
                    } else if (!is_rail(t.x, t.y)) {
                        view.train_ticks = -1;
                        return;
                    } else {
                        reverse = true;
                    }
                    prev_d = t.d2;
                }
                count++;
            }
        }
        if (reverse) {
            view.train.reverse();
            for (let i = 0; i < view.train.length; i++) {
                let t = view.train[i];
                if (t.d2 >= 0) {
                    let tmp = t.d1;
                    t.d1 = t.d2 ^ 2;
                    t.d2 = tmp ^ 2;
                } else {
                    t.d2 = -128;
                }
            }
        }
        if (count === 0) {
            view.train_ticks = -1;
        } else {
            if (view.train_ticks < view.train.length) {
                view.train_ticks++;
            }
        }
    }
    function ship_departs() {
        let pos = simulate.ship_last_pos;
        let s = view.container_ship;

        s.x = (pos % city.map_size_edge) * 16 - 8;
        s.y = Math.floor(pos / city.map_size_edge) * 16 - 8;
        s.z = -8;
        s.dz = 0;
        ship_set_direction(s, simulate.ship_route.shift());
    }
    function ship_next() {
        let s = view.container_ship;
        if (simulate.ship_route.length > 0) {
            ship_set_direction(s, simulate.ship_route.shift());
        }
    }
    function ship_set_direction(s, dir) {
        if (dir != null) {
            if (dir === 64) {
                // shipwreck
                s.dir = -1;
                s.d = -1;
                shipwreck_occur(simulate.ship_last_pos);
                simulate.ship_last_pos = -1;
            } else if (dir === 32) {
                s.dx = 0;
                s.dy = 0;
                s.d = 32;
            } else if ((dir & 16) !== 0) {
                dir = dir & ~16;
                s.dx = DIR8_X[dir];
                s.dy = DIR8_Y[dir];

                dir = (dir + 2) & 7;
                if ((dir - s.dir) < -2 || (dir - s.dir) > 2) {
                    s.dir = (dir + 4) & 7;
                } else {
                    s.dir = dir;
                }
                s.d = 32;
            } else {
                s.dx = DIR8_X[dir];
                s.dy = DIR8_Y[dir];
                s.dir = dir;
                s.d = 16;
                simulate.ship_last_pos += s.dx + s.dy * city.map_size_edge;
                let x = simulate.ship_last_pos % city.map_size_edge - 1;
                let y = Math.floor(simulate.ship_last_pos / city.map_size_edge) - 1;
                if (x < 0 || x >= city.map_size || y < 0 || y >= city.map_size) {
                    s.dir = -1;
                    s.d = -1;
                    simulate.ship_last_pos = -1;
                } else if ((city.tile_data[simulate.ship_last_pos] & M_LAND) !== 0) {
                    s.dir = -1;
                    s.d = -1;
                    shipwreck_occur(simulate.ship_last_pos);
                    simulate.ship_last_pos = -1;
                }
            }
        } else {
            s.dir = -1;
            s.d = -1;
            simulate.ship_last_pos = -1;
        }
    }
    function show_gift_window(name) {
        function push_gift(n) {
            city.gift_buildings.push(BUILD_ICON_INFO_GIFT[n]);
            view.draw_build_icons(city, city.gift_buildings, build_icon_info.length >> 1);
        }
        if (options.popup_window) {
            reset_mouse_drag();
            popup.reset();
            popup.set_back_half_opacity();
            if (name === 'park_casino') {
                popup.show_ok_cancel('ok', null);
                popup.set_layout('canvas-text', null);
                popup.set_title_raw(resource.gettext('amusement_park') + ' / ' + resource.gettext('casino'));
                popup.set_text_content('gift_park_casino');
                popup.select_gift_cursor = 0;
                view.draw_wallpaper_room(popup.get_canvas(), 'amusement_park', 'casino');
                view.draw_popup_window_picture(popup.get_canvas(), 'gift');
                popup.open_delay(null, mode => {
                    if (mode === 'ok') {
                        popup.close();
                        push_gift((popup.select_gift_cursor === 0) ? 'amusement_park' : 'casino');
                    }
                });
            } else {
                popup.show_close_button();
                popup.set_layout('canvas-text', null);
                popup.set_title(name);
                if (name === 'bank') {
                    popup.set_text_content('gift_' + name + (city.ruleset === 'tinycity' ? '_t' : '_m'));
                } else {
                    popup.set_text_content('gift_' + name);
                }
                view.draw_wallpaper_room(popup.get_canvas(), name, null);
                view.draw_popup_window_picture(popup.get_canvas(), 'gift');
                popup.open_delay(null, mode => {
                    popup.close();
                    push_gift(name);
                });
            }
        } else {
            if (name === 'park_casino') {
                name = 'amusement_park';
            }
            view.show_message_ticker_raw(resource.gettext('msg_gift') + resource.gettext(name), true);
            push_gift(name);
        }
    }

    window.setInterval(() => {
        if (earthquake_time_left > 0) {
            if (earthquake_time_left % 2 == 0) {
                view.move_relative(-16, 0);
            } else {
                view.move_relative(16, 0);
            }
            simulate.disaster_quake();
            earthquake_time_left--;
            if (earthquake_time_left === 0) {
                disaster_occur_message('earthquake');
            }
        }
        if (ufo_tick_time >= 0) {
            ufo_move();
            if (ufo_target == null) {
                disaster_occur_message('ufo');
            }
        }
        if (!popup.is_window_open) {
            if (city.calculate_power_grid_required) {
                city.update_power_grid();
            }
            if (city.update_power_grid_required) {
                view.update_power_grid(city);
                city.update_power_grid_required = false;
            }
            let update = null;
            if (!is_world_freeze()) {
                switch (current_speed) {
                case 'normal':
                    update = city.timer_tick(simulate, tornado_time_left > 0 || monster_time_left > 0);
                    view.update_vehicle(view.airplane);
                    view.update_vehicle(view.helicopter);
                    view.update_vehicle(view.container_ship);
                    if (view.tornado.dir >= 0) {
                        tornado_move();
                    }
                    if (view.monster.dir >= 0) {
                        monster_move();
                    }
                    if (view.train_ticks >= 0 && city.ticks % 20 === 0) {
                        train_next();
                    }
                    break;
                case 'fast':
                    update = city.timer_tick_fast(simulate);
                    view.update_vehicle_fast(view.airplane);
                    view.update_vehicle_fast(view.helicopter);
                    view.update_vehicle_fast(view.container_ship);
                    if (view.train_ticks >= 0 && city.ticks % 20 === 0) {
                        train_next();
                    }
                    break;
                }
                if (view.airplane.d === 0) {
                    if (view.airplane.landing) {
                        airplane_landing();
                    } else {
                        if (is_airplane_arrival) {
                            airplane_arrival_next();
                        } else {
                            airplane_takeoff_next();
                        }
                    }
                }
                if (view.helicopter.d === 0) {
                    helicopter_next();
                }
                if (view.container_ship.d === 0 && simulate.ship_route.length > 0) {
                    ship_next();
                }
                if (monster_time_left > 0 && view.monster.d === 0) {
                    monster_time_left--;
                    if (monster_time_left > 0) {
                        monster_next();
                    } else {
                        view.monster.dir = -1;
                    }
                }
                if (current_speed !== 'pause') {
                    if (tornado_time_left > 0) {
                        for (let i = 0; i < 6; i++) {
                            view.tornado.scatter[i] = Math.floor(Math.random() * 4) - 2;
                        }
                        view.tornado.spin++;
                        if (view.tornado.spin >= 4) {
                            view.tornado.spin = 0;
                        }
                        tornado_time_left--;
                        if (tornado_time_left === 0) {
                            view.tornado.dir = -1;
                        }
                    }
                }
            }
            if (update != null) {
                update_indicator();
            }
            if (update === 'rci' || update === 'all') {
                view.update_demand_bar(city);
                view.update_tile_rci(city);
                if (city.next_population > 0 && city.population >= city.next_population) {
                    city.next_population = get_next_category_pops(city.population);

                    if (options.popup_window) {
                        reset_mouse_drag();
                        popup.reset();
                        popup.set_back_half_opacity();
                        popup.show_close_button();
                        popup.set_layout('canvas-text', null);
                        popup.set_title('msg_city_growth');
                        popup.set_text_content('msg_growth_' + get_city_category(city.population));
                        view.draw_wallpaper(popup.get_canvas(), null, 'day', city.population);
                        view.draw_popup_window_picture(popup.get_canvas(), 'growth');
                        popup.open_delay(null, mode => { popup.close(); });
                    } else {
                        view.show_message_ticker('msg_growth_' + get_city_category(city.population), false);
                    }
                    city.update_power_grid_required = true;
                }
            }
            if (update === 'traffic' || update === 'all') {
                view.update_road_traffic(city);
                if (simulate.airplane_departs && view.airplane.dir === -1) {
                    if (is_airplane_arrival) {
                        airplane_arrival();
                    } else {
                        airplane_takeoff();
                    }
                }
                if (simulate.helicopter_departs && view.helicopter.dir === -1) {
                    helicopter_takeoff();
                }
                if (simulate.station_active_pos >= 0 && view.train_ticks < 0) {
                    train_departs();
                }
            }
            if (update === 'police' || update === 'all') {
                if (simulate.ship_last_pos >= 0 && view.container_ship.dir === -1) {
                    ship_departs();
                }
            }
            if (update === 'month' || update === 'all') {
                let msg = null;
                if (city.month === 1) {
                    if (options.popup_window) {
                        show_budget(false);
                    } else {
                        show_budget_ticker();
                    }
                    return;
                }
                if (city.election != null && city.month === 3) {
                    switch (city.election.year - city.year) {
                    case 3:
                        msg = 'msg_last_3year';
                        break;
                    case 2:
                        msg = 'msg_last_2year';
                        break;
                    case 1:
                        msg = 'msg_last_1year';
                        break;
                    case 0:
                        show_election_result();
                        break;
                    }
                    if (msg != null) {
                        view.show_message_ticker(msg, true);
                    }
                }
                if (city.month === 6) {
                    if (simulate.update_radioisotope_decay()) {
                        city.calculate_power_grid_required = true;
                        city.update_power_grid_required = true;
                    }
                }
                msg = city.get_major_problem();
                if (msg != null) {
                    view.show_message_ticker(msg, false);
                }
            }
            if (update === 'disaster') {
                let disaster = simulate.naturally_disaster_occur();
                if (disaster != null) {
                    disaster_occur(disaster);
                }
            }
            if (update === 'event') {
                let event = city.peek_next_event();
                if (event != null) {
                    if (event.type === 'gift') {
                        show_gift_window(event.name);
                    } else if (event.type === 'disaster') {
                        disaster_occur(event.name);
                    }
                }
            }
            view.draw_main(current_speed);
        } else if (current_speed == 'title') {
            view.draw_wallpaper_full('night', 0);
        }
        if (city.disaster_occurs) {
            if (city.disaster_ticks < 0) {
                city.disaster_ticks = 0;
            }
            view.disaster_alert(city.disaster_ticks);
        } else if (city.disaster_ticks >= 0) {
            if (!is_world_freeze() && tornado_time_left === 0 && monster_time_left === 0) {
                view.disaster_alert(-1);
                city.disaster_ticks = -1;
            } else {
                view.disaster_alert(city.disaster_ticks);
            }
        }
        view.message_ticker_tick();
    }, 100);

    if (window.location.hash !== '') {
        resource.current_language = window.location.hash.substr(1);
    }

    resource.init(() => {
        show_title_screen();
        init_filename = null;
        if (window.location.search !== '') {
            init_filename = window.location.search.substr(1);
            if (!/^[a-z0-9_]+$/.test(init_filename)) {
                init_filename = null;
            }
        }
        if (init_filename != null) {
            fetch('./cities/' + init_filename + '.json').then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Cannot read file ' + init_filename);
                }
            }).then(json => {
                show_city_file_info(json, true);
            }).catch(err => {
                show_error_window('Cannot read file ' + init_filename + '.json');
            });
        }
    });
});
