(function (document, window) {

        let change_types = {
                'default': function (el, change_type) {
                }
        };

        /**
         * Коллекция табов
         */
        class TabItemsCollection {
                /**
                 * Внутренний список табов
                 * @type {TabItem[]}
                 */
                items = [];

                /**
                 *
                 * @param {TabItem} item
                 */
                add(item) {
                        this.items.push(item);
                }

                /**
                 * Получить всех детей по названию
                 * @param {string} name Название, по которому будет проходить поиск
                 * @return {TabItem[]}
                 */
                get(name) {
                        return this.filter(el => el.tab_name === name);
                }

                /**
                 * Получить первого ребенки
                 * @return {TabItem}
                 */
                getFirst() {
                        if (this.items.length > 0) {
                                return this.items[0];
                        }
                }

                /**
                 * Получить первого ребенки
                 * @return {TabItem}
                 */
                getLast() {
                        if (this.items.length > 0) {
                                return this.items[this.items.length - 1];
                        }
                }

                /**
                 * Получить первое значение, соответствующее фильтру
                 * @param {function} filter Фильтр, по которому будет поиск
                 * @return {TabItem}
                 */
                find(filter) {
                        return this.items.find(filter);
                }

                /**
                 * Получить все значения, соответствующие фильтру
                 * @param {function} filter Фильтр, по которому будет поиск
                 * @return {TabItem[]}
                 */
                filter(filter) {
                        return this.items.filter(filter);
                }

                /**
                 * Получить все значения в обратном порядке
                 * @return {TabItem[]}
                 */
                getReverse() {
                        return this.items.reverse();
                }
        }

        /**
         * Элемент таба
         */
        class TabItem {
                tab_name;
                tab_path;
                is_active;
                max_depth;
                /**
                 * Коллекция детей
                 * @type {TabItemsCollection}
                 */
                children = new TabItemsCollection();

                constructor(tab_path, max_depth = Infinity, is_active = true) {
                        this.tab_path = tab_path;
                        this.tab_name = tab_path.split('/')[tab_path.split('/').length - 1];
                        this.is_active = is_active;
                        this.max_depth = max_depth;

                        if (this.tab_name.split('/').length < max_depth) {
                                this.loadChildren();
                        }
                }

                /**
                 * Грузим всех детей текущего таба
                 * @return {void}
                 */
                loadChildren() {
                        /**
                         * @type {HTMLElement[]}
                         */
                        let list = [...document.querySelectorAll(`[data-tab]`)];
                        let search_query = new RegExp(`^${this.tab_path}\\/[^\\/]+$`);
                        list = list.filter(function (el) {
                                return el.dataset.tab.search(search_query) !== -1;
                        });
                        if (list.length === 0) {
                                return;
                        }
                        list.forEach((el) => {
                                const tab_name = el.dataset.tab;
                                this.children.add(
                                        new TabItem(
                                                tab_name,
                                                this.max_depth,
                                                el.classList.contains('tab_active') && this.is_active
                                        ));
                        });
                }

                /**
                 * Получить первого активного ребенка
                 * @return {TabItem}
                 */
                getCurrentChild() {
                        return this.children.find(el => el.is_active);
                }

                /**
                 * Распарсить путь от текущего элемента и до последнего дочернего
                 * @param {string[]} path Часть пути, которую будем парсить
                 * @return {{is_full_rule: boolean, result_path: string}}
                 */
                parsePath(path) {
                        let path_real = [this.tab_name];
                        let is_full_rule = false;
                        if (path.length > 1) {
                                let last = false;
                                switch (path[1]) {
                                        case '~current':
                                                path_real.push(
                                                        this.children
                                                                .find(el => el.is_active)
                                                                .parsePath(path.slice(1))
                                                                .result_path
                                                );
                                                break;
                                        case '~next-if-last':
                                                let next_item_to_not_full = this.children
                                                        .find(el => el.is_active)
                                                        .parsePath(path.slice(1));
                                                if (!next_item_to_not_full.is_full_rule) {
                                                        path_real.push(
                                                                this.children
                                                                        .find(el => el.is_active)
                                                                        .parsePath(path.slice(1))
                                                                        .result_path
                                                        );
                                                        break;
                                                }
                                        /** @noinspection FallThroughInSwitchStatementJS */
                                        case '~next':
                                                let next_item = this.children
                                                        .find(el => {
                                                                let last_val = last;
                                                                last = el.is_active;
                                                                return last_val;
                                                        });
                                                if (!next_item) {
                                                        next_item = this.children.getFirst();
                                                        is_full_rule = true;
                                                }
                                                path_real.push(
                                                        next_item
                                                                .parsePath(path.slice(1))
                                                                .result_path
                                                );
                                                break;
                                        case '~previous-if-first':
                                                let previous_item_to_not_full = this.children
                                                        .getReverse()
                                                        .find(el => el.is_active)
                                                        .parsePath(path.slice(1));
                                                this.children.getReverse();
                                                if (!previous_item_to_not_full.is_full_rule) {
                                                        path_real.push(
                                                                this.children
                                                                        .find(el => el.is_active)
                                                                        .parsePath(path.slice(1))
                                                                        .result_path
                                                        );
                                                        break;
                                                }
                                        /** @noinspection FallThroughInSwitchStatementJS */
                                        case '~previous':
                                                let previous_item = this.children
                                                        .getReverse()
                                                        .find(el => {
                                                                let last_val = last;
                                                                last = el.is_active;
                                                                return last_val;
                                                        });
                                                this.children.getReverse();
                                                if (!previous_item) {
                                                        previous_item = this.children.getLast();
                                                        is_full_rule = true;
                                                }
                                                path_real.push(
                                                        previous_item
                                                                .parsePath(path.slice(1))
                                                                .result_path
                                                );
                                                break;
                                        case '~first':
                                                let first_item = this.children.getFirst();
                                                path_real.push(
                                                        first_item
                                                                .parsePath(path.slice(1))
                                                                .result_path
                                                );
                                                break;
                                        case '~last':
                                                let last_item = this.children.getLast();
                                                path_real.push(
                                                        last_item
                                                                .parsePath(path.slice(1))
                                                                .result_path
                                                );
                                                break;
                                        default:
                                                if (this.children.get(path[1]).length > 0) {
                                                        let children = this.children.get(path[1]);

                                                        path_real.push(
                                                                children[0]
                                                                        .parsePath(path.slice(1))
                                                                        .result_path
                                                        );

                                                }
                                                break;
                                }
                        }
                        return {
                                is_full_rule: is_full_rule,
                                result_path: path_real.join('/')
                        };
                }
        }

        const taber = function () {
                const instance = this;

                /**
                 * Получить список непосредственных детей таба
                 * @param {string[]} tab_path Путь родительского таба
                 * @param {HTMLElement[]|null} list Массив элементов среди которых будет вестись поиск
                 */
                const getChildTabs = function (tab_path, list = null) {
                        // ищем элементы 1 уровня вложенности
                        const path_to_search = tab_path.join('\\/').replace(/\*/g, '[^/]+');
                        if (!list) {
                                list = [...document.querySelectorAll(`[data-tab]`)];
                                list = list.filter(function (el) {
                                        return el.dataset.tab
                                                .search(
                                                        new RegExp(`^${path_to_search}\\/[^\\/]+$`)
                                                ) !== -1;
                                });
                        }
                        if (list.length === 0) {
                                throw new Error(`Список элементов для таба пуст (${path_to_search})`);
                        }
                        return list;
                };

                /**
                 * @param {jQuery} elements
                 */
                const openTab = function (elements) {
                        const path = elements[0].dataset.tab.split('/');

                        // Активируем таб с самого глубокого в сторону самого верхнего
                        path.reverse().forEach(((value, index, array) => {
                                if (array.length - index > 1) {
                                        openTabOneLevel(array.slice(index).reverse());
                                }
                        }));
                }

                /**
                 * Get event
                 * @param event_name
                 * @returns {Event}
                 */
                const getEvent = function (event_name) {
                        let event;
                        try {
                                event = new Event(event_name, {bubbles: true, cancelable: true});
                        } catch ($e) {
                                event = document.createEvent('Event');
                                event.initEvent(event_name, true, true)
                        }
                        return event;
                }

                /**
                 * Смотрит есть ли у элемента прокрутка
                 * @param {HTMLElement} element
                 * @return {boolean}
                 */
                const checkElementOverflowing = function (element) {
                        if (!element) return false;
                        const rect = element.getBoundingClientRect();
                        return Math.round(rect.left + rect.right) < window.innerWidth;
                }

                /**
                 * Прокрутить элемент до видимой части
                 * @param {HTMLElement} element
                 */
                const scrollIntoView = function (element) {
                        if (checkElementOverflowing(element.offsetParent)) {
                                element.offsetParent.scroll({
                                        left: element.offsetLeft - (element.offsetParent.offsetWidth + element.offsetWidth) / 2,
                                        top: element.offsetTop - (element.offsetParent.offsetHeight + element.offsetHeight) / 2,
                                        behavior: "smooth"
                                });
                        }
                }

                const setChange = function (element, change_type) {

                        let current_change_type = element.dataset.toggleType || 'default';

                        if (typeof change_types[current_change_type] === "undefined") {
                                console.warn(`Не найден тип переключения ${current_change_type}. Будет использован <b>default</b>`);
                                current_change_type = 'default';
                        }


                        switch (change_type) {
                                case 'close':
                                        element.classList.remove('tab_active');
                                        break;
                                case 'open':
                                        element.classList.add('tab_active');
                                        break;
                        }

                        change_types[current_change_type](element, change_type);
                }

                /**
                 * Закрыть конкретный таб по пути или присланным элементам
                 * @param {HTMLElement[]|string} path Путь или элементы.
                 * @return {boolean}
                 */
                const closeTab = function (path) {
                        if (typeof path === "string") {
                                path = [...document.querySelectorAll(`[data-tab="${path}"]`)];
                        }
                        const paths_to_close = [];

                        const before_close_event = getEvent('tab-before-close');
                        const after_close_event = getEvent('tab-after-close');

                        const elements_to_close = path.filter((el) => {
                                return el.dispatchEvent(before_close_event);
                        });

                        if (elements_to_close.length === 0) {
                                return false;
                        }

                        // Активируем таб с самого глубокого в сторону самого верхнего
                        elements_to_close
                                .forEach((element) => {
                                        paths_to_close.push(element.dataset.tab);
                                        setChange(element, 'close');
                                        element.dispatchEvent(after_close_event);
                                });
                        // .find('iframe.youtube-iframe')
                        // .each((_, element) => {
                        //         JSHelper.stopVideo(element);
                        // });

                        paths_to_close.forEach((value) => {
                                [...document.querySelectorAll('[data-opentab="' + value + '"]')]
                                        .forEach(el => el.classList.remove('tab-title-active'));
                        });
                        return true;
                }

                /**
                 * Открывает табы по пути или элементам
                 * @param {HTMLElement[]|string} path Путь или элементы. Все элементы должны иметь один путь.
                 */
                const openThisTab = function (path) {
                        if (typeof path === "string") {
                                path = [...document.querySelectorAll(`[data-tab="${path}"]`)];
                        }
                        path
                                .forEach((element) => {
                                        setChange(element, 'open');
                                        element.dispatchEvent(getEvent('tab-open'));
                                })
                        // .find('div.youtube-iframe:visible') // todo: перенести в настраиваемые модули
                        // .each((_, element) => {
                        //         changeTag(element, 'iframe');
                        // });

                        document.querySelectorAll(`[data-opentab="${path[0].dataset.tab}"]`)
                                .forEach(el => {
                                        el.classList.add('tab-title-active');
                                        scrollIntoView(el);
                                });
                }

                /**
                 * Открываем один таб на уровне, остальные закрываем
                 * @param {string[]} path Путь, по которому надо открыть таб
                 */
                const openTabOneLevel = function (path) {
                        const children = getChildTabs(path.slice(0, path.length - 1));
                        const children_to_close = [...children.filter(el => el.dataset.tab !== path.join('/'))];
                        const children_to_show = [...children.filter(el => el.dataset.tab === path.join('/'))];
                        closeTab(children_to_close);
                        openThisTab(children_to_show);
                };

                /**
                 * Открвть конкретный таб по пути
                 * @param {string[]} real_path Элемент, с который хотим открыть.
                 */
                instance.openTab = function (real_path) {
                        let elements = [...document.querySelectorAll(`[data-tab="${real_path}"]`)];
                        if (elements.length === 0) {
                                console.error(`Нет таба для показа!`, real_path);
                                return;
                        }
                        openTab(elements);
                };

                /**
                 * Открыть таб по пути
                 * @param {string|string[]} path
                 * @param is_close_if_opened
                 */
                instance.openParsedPath = function (path, is_close_if_opened) {
                        if (typeof path === "string") {
                                path = path.split('/');
                        }
                        const tab = new TabItem(path[0], path.length);
                        const path_to_open = tab.parsePath(path).result_path;
                        const element = document.querySelector(`[data-tab="${path_to_open}"]`);
                        if (!element.classList.contains('tab_active') || !is_close_if_opened) {
                                instance.openTab(path_to_open);
                        } else if (is_close_if_opened) {
                                closeTab(path_to_open);
                        }
                }

                /**
                 * Длбавление кастомного открытия / закрытия
                 * @param {string} type_name
                 * @param {AddTaberChange} callback
                 */
                instance.setChangeType = function (type_name, callback) {
                        change_types[type_name] = callback;
                }

                /**
                 * Инит. Развешивает события на странице.
                 */
                const init = function () {
                        document.addEventListener('click', function (e) {
                                if (e.target.closest('[data-opentab][data-tab-toggle="click"],[data-opentab]:not([data-tab-toggle])')) {
                                        const element = e.target.closest('[data-opentab],a[href],[data-stoptab]');
                                        if (element.dataset.opentab) {
                                                const path = element.dataset.opentab.split('/');
                                                instance.openParsedPath(path, element.dataset.toggle === 'tab');
                                        }
                                }
                        })

                        document.addEventListener('change', function (e) {
                                if (e.target.closest('[data-opentab][data-tab-toggle="change"]')) {
                                        if (e.target.checked) {
                                                const path = e.target.closest('[data-opentab]').dataset.opentab.split('/');
                                                instance.openParsedPath(path);
                                        }
                                }
                        });
                };

                init();
        };

        /**
         * @callback AddTaberChange
         * @param {HTMLElement} element_to_change
         * @param {"open"|"close"} change_type
         */

        window.Taber = new taber();
})(document, window);