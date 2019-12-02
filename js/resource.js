'use strict';

const resource = new (function() {
    const table = {
        en: {
            // Buildings
            airport:          "Airport",
            amusement_park:   "Amusement Park",
            bank:             "Bank",
            bulldoze:         "Bulldoze",
            casino:           "Casino",
            castle:           "Castle",
            coal_power_plant: "Coal Power Plant",
            crossing:         "Level crossing",
            c_zone:           "Commercial zone",
            expo:             "Universal Exposition",
            fire_dept:        "Fire Department",
            fire_hq:          "Fire Dep. Headquarters",
            fountain:         "Fountain",
            garden:           "Garden",
            gas_power_plant:  "Gas Power Plant",
            goods_st:         "Goods Station",
            hospital:         "Hospital",
            i_zone:           "Industrial zone",
            land:             "Land",
            land_clear:       "Open land",
            land_fill:        "Land fill",
            library:          "Library",
            monolith:         "Monolith",
            monster_statue:   "500,000 Monument",
            nuke_power_plant: "Nuclear Power Plant",
            police_dept:      "Police Department",
            police_hq:        "Police Dep. Headquarters",
            railroad:         "Railroad",
            rail_bridge:      "Railroad Bridge",
            road:             "Road",
            road_bridge:      "Road Bridge",
            rubble:           "Rubble",
            r_zone:           "Residential zone",
            school:           "School",
            sea_port:         "Sea Port",
            stadium:          "Stadium",
            station:          "Station",
            terminal_station: "Terminal Station",
            tower:            "Tower",
            tree:             "Tree",
            water_area:       "Water",
            windmill:         "Windmill",
            wire:             "Power Line",
            your_house:       "Your house",
            zoo:              "Zoo",

            // UI
            all_zones:        "RCI zones",
            arrested:         "Arrested",
            assessed_value:   "Assessed $",
            audiences:        "Audiences",
            auto_bulldoze:    "Auto bulldoze",
            bankrupt:         "Bankrupt",
            bond:             "Bond",
            bond_5year:       "Issue a $2000 bond (5 years)",
            bond_10year:      "Issue a $3000 bond (10 years)",
            budget:           "Budget",
            budget_draft:     "Budget draft",
            c_zones:          "C zones",
            cancel:           "Cancel",
            city_scale:       "Category",
            coast:            "Coast",
            color_bf_mode:    "Color barrier-free",
            commitment:       "Public commitment",
            cost:             "Cost",
            crime:            "Crime",
            current_funds:    "Current funds",
            debt:             "Debt",
            developed:        "Developed",
            difficulty:       "Difficulty",
            disaster:         "Disaster",
            dispatched:       "Dispatched",
            download:         "Download",
            election:         "Election",
            election_result:  "Election result",
            estimeted_funds:  "Estimated funds",
            evaluation:       "Evaluation",
            expenses:         "Expenses",
            file:             "File",
            fire_cov:         "Fire coverage",
            fire_depts:       "Fire depts.",
            fire_funds:       "Fire funds",
            freight_volume:   "Freight volume",
            funds:            "Funds",
            gdp:              "GDP $",
            generate_terrain: "Generate terrain",
            get_random:       "Get random name",
            goto_menu:        "Restart game",
            graph:            "Graph",
            growth_last_year: "Growth (Last year)",
            help:             "Help",
            hidden_assets:    "Hidden assets $",
            hospitals:        "Hospitals",
            housing_cost:     "Housing costs",
            i_zones:          "I zones",
            island:           "Island",
            import_csv:       "Import from CSV",
            import_mp:        "Import from Micropolis",
            incomes:          "Incomes",
            inspect:          "Inspect",
            interest:         "Interest",
            lake:             "Lake",
            land_value:       "Land value",
            language:         "Language",
            llama:            "Llamas",
            load_file:        "Load from the file",
            loan:             "Loan",
            loan_10000:       "Get a $10000 Loan",
            map:              "Map",
            max_output:       "Max output",
            micropolis:       "Micropolis",
            naming_city:      "Naming your city",
            next_funds:       "Next year's funds",
            not_available:    "Not available",
            ok:               "OK",
            options:          "Options",
            passengers:       "Passengers",
            patients:         "Patients",
            payment_complete: "Payment completion",
            payment_balance:  "Payment balance",
            police_cov:       "Police coverage",
            police_depts:     "Police depts.",
            police_funds:     "Police funds",
            pollution:        "Pollution",
            population:       "Population",
            pop_density:      "Population density",
            pop_growth:       "Population growth",
            popup_window:     "Popup window",
            power_grid:       "Power grid",
            power_outage:     "Power outage",
            power_plants:     "Power plants",
            power_req:        "Power required",
            power_supplied:   "Supplied",
            public_opinion:   "Public Opinion",
            quit:             "Quit",
            r_zones:          "R zones",
            radioactivity:    "Radioactivity",
            river:            "River",
            ruleset:          "Ruleset",
            save_file:        "Save to the file",
            scenario:         "Scenario",
            schools:          "Schools",
            score:            "Score",
            special_income:   "Special income",
            sound_effect:     "Sound effect",
            start_city:       "Start new city",
            start_game:       "Start Game",
            stations:         "Stations",
            statistics:       "Statistics",
            students:         "Students",
            tax:              "Tax",
            taxes:            "Taxes",
            terrain_editor:   "Terrain Editor",
            tinycity:         "TinyCity",
            top_develop:      "Top",
            total:            "Total",
            traffic_funds:    "Traffic funds",
            traffic_jam:      "Traffic jam",
            traffic_volume:   "Traffic volume",
            transportation:   "Transportation",
            unemployment:     "Unemployment",
            update:           "Update",
            woods:            "Woods",

            // Disasters
            airplane_crash:   "Airplane crash",
            earthquake:       "Earthquake",
            fire:             "Fire",
            flood:            "Flood",
            meltdown:         "Meltdown",
            monster:          "Monster",
            shipwreck:        "Shipwreck",
            tornado:          "Tornado",
            ufo:              "UFO",

            // City scale
            village:          "Village",
            town:             "Town",
            city:             "City",
            capital:          "Capital",
            metropolis:       "Metropolis",
            megalopolis:      "Megalopolis",

            // General
            cheap:            "Cheap",
            creative:         "Creative",
            expensive:        "Expensive",
            expert:           "Expert",
            frequent:         "Frequent",
            high:             "High",
            infinity:         "∞",
            low:              "Low",
            master:           "Master",
            medium:           "Medium",
            no:               "No",
            none:             "None",
            novice:           "Novice",
            peaceful:         "Peaceful",
            rare:             "Rare",
            very_high:        "Very high",
            yes:              "Yes",

            // Message
            msg_airport_req:    "Commerce requires an Airport.",
            msg_blackout:       "Power outage occurred.",
            msg_financial_dif:  "Finance is getting worse.",
            msg_gift:           "You have received a gift: ",
            msg_last_1year:     "You have 1 year in your term of office.",
            msg_last_2year:     "You have 2 years in your term of office.",
            msg_last_3year:     "You have 3 years in your term of office.",
            msg_pb_crime:       "Crime very high.",
            msg_pb_pollution:   "Pollution very high.",
            msg_pb_taxes:       "Tax too high.",
            msg_pb_traffic_jam: "Frequent traffic jams reported.",
            msg_pb_unemployment:"Unemployment rate is high.",
            msg_power_plant:    "Build more Power plants.",
            msg_stadium_req:    "Residents demand a Stadium.",
            msg_port_req:       "Industry requires a Sea Port.",
            msg_port_st_req:    "Industry requires a Sea Port or a Goods Station.",
            msg_see_you:        "See you soon. Goodbye.",
            msg_support_rate:   "Is the mayor doing a good job?",
            msg_whats_problems: "What are the worst problems?",

            msg_loan:           "Pay $500 every year for 21 years.",
            msg_rule_tinycity:  "TinyCity ruleset is different from 1989's SimCity®.\nCitizens do not take a train directly.\n(Build stations!)\nWhile disaster occurs, you cannot build nor bulldoze any buildings.\nNuclear is no longer available.\nYou can choose gas power but ...",
            msg_rule_micropolis:"Micropolis ruleset is almost the same as the SNES version of SimCity®\nGame engine is not same as SimCity's engine so you get different result.\nMap size is larger a little.\n(128x128)",

            msg_drop_files1:    "Drop the file here",
            msg_drop_files2:    "Click here to choose the file",
            msg_city_growth:    "Congratulations!!",
            msg_elect_lose:     "You lost the election. You should consider taking a vacation.",
            msg_elect_win:      "Congratulations!! You have been re-elected as mayor.",
            msg_elect_result:   "Incumbent (You): {votes1} votes.\nNewcomer: {votes2} votes.",
            msg_growth_town:    "Your village has grown to a TOWN.\nKeep up the good work!",
            msg_growth_city:    "Your town has grown to a CITY.\nReduce traffic congestion and the crime rate helps your city to grow.",
            msg_growth_capital: "Your city has became a CAPITAL.\nAre you ready to build Airports and Seaports?",
            msg_growth_metropolis:"Your city has now achieved to the status of METROPOLIS.\nIt's time to show your stuff.",
            msg_growth_megalopolis:"Your city have reached the highest category, the MEGALOPOLIS.\nCan you rezone areas and increace population to 700,000? Good luck!",
            msg_bankrupt:       "Your city has bankrupted.\nYou were fired from the mayor.",

            cond_population:    "Population {pops} or more.",
            cond_support_rate:  "Support rate {rate}% or more.",
            cond_probrems:      "Probrem '{probrem}' {rate}% or less.",

            disaster_airplane_crash:"A plane has crashed!",
            disaster_earthquake:    "A major earthquake has occurred!\nMake sure to reconnect the power grid and rebuild the city.",
            disaster_fire:          "A fire has been reported!",
            disaster_flood:         "Flooding has been reported along the water's edge!",
            disaster_meltdown:      "A nuclear meltdown has occurred!\nYou are advised to avoid the area until the radioactive isotopes decay.",
            disaster_monster:       "A large creature has been observed.\nTry calling ウルトラ警備隊 or wait till he/she leaves.",
            disaster_shipwreck:     "A ship has wrecked!",
            disaster_tornado:       "A tornado has been reported!",
            disaster_ufo:           "Unidentified flying objects are attacking your city!",

            gift_bank_m:           "Why don't you build a Bank?\nIf you need funding, you can get a loan $10000.",
            gift_bank_t:           "Why don't you build a Bank?\nIf you need funding, you can issue a bond.",
            gift_expo:             "Why don't you hold an exposition to develop industory.\nLet's build a Exposition venue.",
            gift_fire_hq:          "Why don't you build a Police department headquaters?\nThis facility will give your city a wider area of fire protection.",
            gift_fountain:         "Congratulations on the 50th anniversary!!\nThis fountain is donated by citizens. Let's build it.",
            gift_garden:           "Why don't you build a Garden?\nThat will improve surrounding areas' environment.",
            gift_land_fill:        "Are you running out of land to develop?\nWith the land fill, you can reclaim more land.",
            gift_library:          "Why don't you build a library for the increasing number of shool kids?",
            gift_monolith:         "Congratulations!! This city have reached population 700,000!\nYou are the greatest mayer I have seen.",
            gift_monster_statue:   "Congratulations!!\nThis statue is made by some artist to bless that the city have reached population 500,000.",
            gift_park_casino:      "Why don't you build a Amusement facility?\nCasino gives us special income but causes crime.\nWhich do you like Amusement park or Casino?",
            gift_police_hq:        "Why don't you build a Police department headquaters?\nThis facility will give your city a wider area of police protection.",
            gift_terminal_station: "Why don't you build a station?\nThat will help to develop the surrounding areas and gives us special income!",
            gift_tower:            "Why don't you build a Tower for the tourists attraction?",
            gift_windmill:         "A windmill has been sent from Amsterdam in remembrance of our sister-city affiliation.\nLet's build it.",
            gift_your_house:       "Where would you like to build your own house?\nDo you want to live center of the city or quiet area away from the center?",
            gift_zoo:              "How about building a zoo for the children of the city?\nThe income from the zoo will be added as special income.",

            decimal: ".",
            symbol_r: "R",
            symbol_c: "C",
            symbol_i: "I",
            vec_r_mark: [
                {stroke: '#008000', lineWidth: 4},
                [[-10, 15], [-10,-15], [  8,-15], [  8,  0], [ -2,  0], [ 10, 15]],
            ],
            vec_c_mark: [
                {stroke: '#000080', lineWidth: 4},
                [[ 10,-15], [-10,-15], [-10, 15], [ 10, 15]],
            ],
            vec_i_mark: [
                {stroke: '#c08000', lineWidth: 4},
                [[  0,-15], [  0, 15]],
            ],

            _month_name:        ["Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            fn_datestr: function(year, month) {
                return this._month_name[month - 1] + " " + year;
            },
        },
    };
    const table_en = table.en;
    this.language_menu = [
        {text_raw: 'Deutsch', value: 'lang_de'},
        {text_raw: 'English', value: 'lang_en'},
        {text_raw: 'Español', value: 'lang_es'},
        {text_raw: '日本語', value: 'lang_ja'},
        {text_raw: '简体中文', value: 'lang_zh'},
        {text_raw: '繁體中文', value: 'lang_zh_hant'},
    ];
    this.language_info = {
        // A:OK   B:Correction needed
        de:      { progress:  88, quality: 'B', authors: ['x768'] },
        en:      { progress: 100, quality: 'A', authors: ['x768'] },
        es:      { progress:  88, quality: 'B', authors: ['x768'] },
        ja:      { progress: 100, quality: 'A', authors: ['x768'] },
        zh:      { progress:  94, quality: 'B', authors: ['x768'] },
        zh_hant: { progress:  94, quality: 'B', authors: ['x768'] },
    };
    let aliases = {
        zh_tw: 'zh_hant',
        zh_hk: 'zh_hant',
        zh_mo: 'zh_hant',
    };

    this.current_language = 'en';
    let languages = window.navigator.languages;
    if (languages.length > 0) {
        for (let i = 0; i < languages.length; i++) {
            let lang = languages[i].toLowerCase().replace('-', '_');
            if (aliases[lang] != null) {
                lang = aliases[lang];
            }
            if (this.language_info[lang] != null) {
                this.current_language = lang;
                break;
            }
            lang = lang.substr(0, 2);
            if (this.language_info[lang] != null) {
                this.current_language = lang;
                break;
            }
        }
    }

    this.append = function(key, hash) {
        table[key] = hash;
    };
    this.init = function(callback) {
        this.set_language(this.current_language, callback);
    };
    this.set_language = function(key, callback) {
        this.current_language = key;
        if (table[key] != null) {
            callback();
        } else {
            let script = document.createElement('script');
            script.setAttribute('src', 'js/res/' + key + '.js');
            script.addEventListener('load', callback);
            document.head.appendChild(script);
        }
    };
    this.gettext = function(key) {
        let tmp;
        if ((tmp = table[this.current_language][key]) != null) {
            return tmp;
        } else if ((tmp = table_en[key]) != null) {
            return tmp;
        } else {
            return '???';
        }
    };
    this.format = function(key, param) {
        let src = this.gettext(key);
        for (let k in param) {
            let p = param[k];
            if (typeof(p) === 'string') {
                p = this.gettext(p);
            }
            src = src.replace('{' + k + '}', p);
        }
        return src;
    };
    this.yearstr = function(year) {
        let tmp;
        if ((tmp = table[this.current_language].fn_yearstr) != null) {
            return tmp(year);
        } else {
            return String(year);
        }
    };
    this.datestr = function(year, month) {
        let tbl = table[this.current_language];
        if (tbl.fn_datestr != null) {
            return tbl.fn_datestr(year, month);
        } else {
            return table_en.fn_datestr(year, month);
        }
    };
    this.complete_rate = function() {
        let total = 0;
        let done = 0;
        let t = table[this.current_language];
        for (let k in t) {
            total++;
            if (t[k]) {
                done++;
            }
        }
        return done / total;
    };
})();
