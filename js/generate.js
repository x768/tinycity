'use strict';

function GenerateMap() {
    const DIR_N = 0;
    const DIR_NE = 1;
    const DIR_E = 2;
    const DIR_SE = 3;
    const DIR_S = 4;
    const DIR_SW = 5;
    const DIR_W = 6;
    const DIR_NW = 7;

    let map_size_edge = 0;
    let limit = 0;
    let tiles = null;

    this.set_city = function(city) {
        map_size_edge = city.map_size_edge;
        limit = map_size_edge - 2;
        tiles = city.tile_data;
    };

    function move(pos, dir) {
        switch (dir) {
        case DIR_N:
            pos.y--;
            break;
        case DIR_NE:
            pos.x++;
            pos.y--;
            break;
        case DIR_E:
            pos.x++;
            break;
        case DIR_SE:
            pos.x++;
            pos.y++;
            break;
        case DIR_S:
            pos.y++;
            break;
        case DIR_SW:
            pos.x--;
            pos.y++;
            break;
        case DIR_W:
            pos.x--;
            break;
        case DIR_NW:
            pos.x--;
            pos.y--;
            break;
        }
    }
    function draw_circle(cpos, r, t) {
        for (let dy = -r; dy <= r; dy++) {
            let y = cpos.y + dy;
            let r2 = Math.floor(r * 1.5) - Math.abs(dy);
            if (r2 > r) {
                r2 = r;
            }
            if (y > 0 && y <= limit) {
                let pos = y * map_size_edge;
                for (let dx = -r2; dx <= r2; dx++) {
                    let x = cpos.x + dx;
                    if (x > 0 && x <= limit) {
                        tiles[pos + x] = t;
                    }
                }
            }
        }
    }
    function fill_rect(x1, y1, x2, y2, t) {
        for (let y = y1; y < y2; y++) {
            let pos = y * map_size_edge;
            for (let x = x1; x < x2; x++) {
                tiles[pos + x] = t;
            }
        }
    }
    function river_winding(g_dir, initial_pos, width) {
        let pos = {x: initial_pos.x, y: initial_pos.y};
        let dir = g_dir;
        let curve = 0;

        while (pos.x > 0 && pos.x <= limit && pos.y > 0 && pos.y <= limit) {
            draw_circle(pos, width, M_WATER);

            let r = Math.random();
            if (curve === 0) {
                if (r < 0.125) {
                    curve = -1;
                    dir = (g_dir + curve) % 8;
                } else if (r < 0.25) {
                    curve = 1;
                    dir = (g_dir + curve) % 8;
                }
            } else {
                if (r < 0.25) {
                    curve = 0;
                    dir = g_dir;
                }
            }
            move(pos, dir);
        }
    }
    function put_ponds(max_num) {
        let n = Math.floor(Math.random() * max_num);
        for (let i = 0; i < n; i++) {
            let x = Math.floor(Math.random() * limit) + 1;
            let y = Math.floor(Math.random() * limit) + 1;
            let n2 = Math.floor(Math.random() * 5) + 3;
            for (let j = 0; j < n2; j++) {
                let dx = Math.floor(Math.random() * 11) + 5;
                let dy = Math.floor(Math.random() * 11) + 5;
                draw_circle({x: x + dx, y: y + dy}, Math.floor(Math.random() * 4) + 2, M_WATER);
            }
        }
    }
    function put_tree(cx, cy, r) {
        cx -= Math.floor(r / 2);
        cy -= Math.floor(r / 2);
        let n = r * r;
        for (let i = 0; i < r; i++) {
            let x = cx + Math.floor(Math.random() * r);
            let y = cy + Math.floor(Math.random() * r);
            if (x > 0 && x <= limit && y > 0 && y <= limit) {
                let pos = x + y * map_size_edge;
                if (tiles[pos] === M_LAND) {
                    tiles[pos] = M_TREE;
                }
            }
        }
    }
    function splay_tree() {
        let dense = Math.floor(Math.random() * (limit * limit / 32));
        for (let i = 0; i < dense; i++) {
            let x = Math.floor(Math.random() * limit);
            let y = Math.floor(Math.random() * limit);
            let r = Math.floor(Math.random() * 8) + 4;
            put_tree(x, y, r);
        }
    }
    function remove_noise() {
        for (let y = 1; y <= limit; y++) {
            let pos = y * map_size_edge;
            for (let x = 1; x <= limit; x++) {
                if (tiles[pos + x] === M_WATER) {
                    if (tiles[pos + x - map_size_edge] === M_LAND &&
                        tiles[pos + x - 1] === M_LAND &&
                        tiles[pos + x + map_size_edge] === M_LAND)
                    {
                        tiles[pos + x] = M_LAND;
                    }
                } else {
                    if (tiles[pos + x - map_size_edge] === M_WATER &&
                        tiles[pos + x - 1] === M_WATER &&
                        tiles[pos + x + map_size_edge] === M_WATER)
                    {
                        tiles[pos + x] = M_WATER;
                    }
                }
            }
        }
    }

    this.fill = function(t) {
        fill_rect(1, 1, limit + 1, limit + 1, t);
    };

    this.make_river = function() {
        fill_rect(1, 1, limit + 1, limit + 1, M_LAND);

        let pos = {
            x: Math.floor(Math.random() * map_size_edge * 0.5 + map_size_edge * 0.25),
            y: Math.floor(Math.random() * map_size_edge * 0.5 + map_size_edge * 0.25),
        };

        river_winding(0, pos, Math.floor(4 + Math.random() * 3));
        river_winding(4, pos, Math.floor(4 + Math.random() * 3));
        if (Math.random() < 0.5) {
            river_winding(2 + Math.floor(Math.random() * 2) * 4, pos, Math.floor(3 + Math.random() * 2));
        }
        put_ponds(limit * limit / 1024);
        remove_noise();
        splay_tree();
    };

    this.make_island = function() {
        let n1 = Math.floor(map_size_edge * 0.0625);
        let n2 = map_size_edge - n1;
        let pos = {x: 0, y: 0};

        fill_rect(1, 1, limit + 1, n1, M_WATER);
        fill_rect(1, n1, n1, n2, M_WATER);
        fill_rect(n1, n1, n2, n2, M_LAND);
        fill_rect(n2, n1, limit + 1, n2, M_WATER);
        fill_rect(1, n2, limit + 1, limit + 1, M_WATER);

        for (pos.x = n1; pos.x < n2; pos.x += 6) {
            pos.y = n1 + Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 3, M_WATER);
            pos.y = n2 - Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 3, M_WATER);
        }

        for (pos.y = n1; pos.y < n2; pos.y += 6) {
            pos.x = n1 + Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 3, M_WATER);
            pos.x = n2 - Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 3, M_WATER);
        }
        put_ponds(limit * limit / 4096);
        splay_tree();
    };

    this.make_lake = function() {
        let n1 = Math.floor(map_size_edge * 0.375);
        let n2 = map_size_edge - n1;
        let pos = {x: 0, y: 0};

        fill_rect(1, 1, limit + 1, n1, M_LAND);
        fill_rect(1, n1, n1, n2, M_LAND);
        fill_rect(n1, n1, n2, n2, M_WATER);
        fill_rect(n2, n1, limit + 1, n2, M_LAND);
        fill_rect(1, n2, limit + 1, limit + 1, M_LAND);

        for (pos.x = n1; pos.x < n2; pos.x += 6) {
            pos.y = n1 + Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 3, M_WATER);
            pos.y = n2 - Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 3, M_WATER);
        }

        for (pos.y = n1; pos.y < n2; pos.y += 6) {
            pos.x = n1 + Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 3, M_WATER);
            pos.x = n2 - Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 3, M_WATER);
        }
        put_ponds(limit * limit / 4096);
        splay_tree();
    };

    this.make_coast = function() {
        let n1 = Math.floor(map_size_edge * 0.125);
        let n2 = map_size_edge - n1;
        let pos = {x: 0, y: 0};

        fill_rect(1, 1, limit + 1, n1, M_WATER);
        fill_rect(1, n1, limit + 1, limit + 1, M_LAND);

        for (pos.x = 0; pos.x < limit + 1; pos.x += 6) {
            pos.y = n1 + Math.floor(Math.random() * 8);
            draw_circle(pos, Math.floor(Math.random() * 6) + 5, M_WATER);
        }
        if (Math.random() < 0.5) {
            pos.x = Math.floor(Math.random() * map_size_edge * 0.5 + map_size_edge * 0.25);
            pos.y = n1;
            river_winding(DIR_S, pos, Math.floor(4 + Math.random() * 3));
        } else {
            put_ponds(limit * limit / 4096);
        }
        splay_tree();
    };
    this.get_random_name = function() {
        let names = [
            'Baghdad',
            'Bangkok',
            'Beijing',
            'Berlin',
            'Buenos Aires',
            'Cairo',
            'Chicago',
            'Helsinki',
            'Hong Kong',
            'Istanbul',
            'Jakarta',
            'Johannesburg',
            'London',
            'Los Angels',
            'Madrid',
            'Manila',
            'Moscow',
            'Nairobi',
            'New Delhi',
            'New York',
            'Osaka',
            'Ottawa',
            'Paris',
            'Rome',
            'São Paulo',
            'Shanghai',
            'Singapore',
            'Sydney',
            'Taipei',
            'Tokyo',
            'Warszawa',
        ];
        return names[Math.floor(Math.random() * names.length)];
    };
}
