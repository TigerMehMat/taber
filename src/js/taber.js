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
                let list = $(`[data-tab]`);
                let search_query = new RegExp(`^${this.tab_path}\\/[^\\/]+$`);
                list = list.filter(function (i, el) {
                        return $(el).data('tab').search(search_query) !== -1;
                });
                if (list.length === 0) {
                        return;
                }
                list.each((i, el) => {
                        const tab_name = el.getAttribute('data-tab');
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
         * @param {jQuery} list Массив элементов среди которых будет вестись поиск
         */
        const getChildTabs = function (tab_path, list = null) {
                // ищем элементы 1 уровня вложенности
                const path_to_search = tab_path.join('\\/').replace(/\*/g, '[^/]+');
                if (!list) {
                        list = $(`[data-tab]`);
                        list = list.filter(function (i, el) {
                                let search_query = `^${path_to_search}\\/[^\\/]+$`;
                                return $(el).data('tab').search(new RegExp(search_query)) !== -1;
                        });
                }
                if (list.length === 0) {
                        throw new Error(`Список элементов для таба пуст (${path_to_search})`);
                }
                return list;
        };

        /**
         * @param {jQuery} $element
         */
        const openTab = function ($element) {
                const path = $element.data('tab').split('/');

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
                        event = new Event(event_name);
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

        /**
         * Заменяет элемент (например, div)
         * @param {HTMLElement} element_to_change Элемент, который надо заменить
         * @param {string} rename_to Новый тег
         */
        const changeTag = function (element_to_change, rename_to) {
                let new_element = $(document.createElement(rename_to));


                $.each(element_to_change.attributes, function () {
                        new_element.attr(this.name, this.value);
                });

                element_to_change.replaceWith(new_element.get(0));
        }

        /**
         * Закрыть конкретный таб по пути или присланным элементам
         * @param {jQuery|string} path Путь или элементы.
         * @return {boolean}
         */
        const closeTab = function (path) {
                if (typeof path === "string") {
                        path = $(`[data-tab="${path}"]`);
                }
                const paths_to_close = [];

                const before_close_event = getEvent('before-close-tab');
                const after_close_event = getEvent('after-close-tab');

                const elements_to_open = path.filter((_, el) => {
                        return el.dispatchEvent(before_close_event);
                });

                if (elements_to_open.length === 0) {
                        return false;
                }

                // Активируем таб с самого глубокого в сторону самого верхнего
                elements_to_open
                        .each((_, element) => {
                                const $element = $(element);
                                paths_to_close.push($element.data('tab'));

                                switch ($element.data('toggle-type')) {
                                        case 'slide':
                                                $element
                                                        .slideUp(window.config.normal_animate_duration || 500, function () {
                                                                $element
                                                                        .removeClass('tab_active')
                                                                        .css('display', '');
                                                                element.dispatchEvent(after_close_event);
                                                        });
                                                break;
                                        default:
                                                $element.removeClass('tab_active');
                                                element.dispatchEvent(after_close_event);
                                                break;
                                }
                        })
                        // .find('iframe.youtube-iframe')
                        // .each((_, element) => {
                        //         JSHelper.stopVideo(element);
                        // });

                paths_to_close.forEach((value, index, array) => {
                        array[index] = '[data-opentab="' + value + '"]';
                });

                $(paths_to_close.join(','))
                        .removeClass('tab-title-active');
                return true;
        }

        /**
         * Открывает табы по пути или элементам
         * @param {jQuery|string} path Путь или элементы. Все элементы должны иметь один путь.
         */
        const openThisTab = function (path) {
                if (typeof path === "string") {
                        path = $(`[data-tab="${path}"]`);
                }
                path
                        .each((_, element) => {
                                const $element = $(element);

                                switch ($element.data('toggle-type')) {
                                        case 'slide':
                                                $element
                                                        .slideDown(window.config.normal_animate_duration || 500, function (e) {
                                                                $element
                                                                        .addClass('tab_active')
                                                                        .css('display', '');
                                                        });
                                                break;
                                        default:
                                                $element.addClass('tab_active');
                                                break;
                                }
                        })
                        .trigger('tab-open')
                        .find('div.youtube-iframe:visible')
                        .each((_, element) => {
                                changeTag(element, 'iframe');
                        });

                $(`[data-opentab="${path.filter(':first').data('tab')}"]`)
                        .addClass('tab-title-active')
                        .each((_, element) => {
                                scrollIntoView(element);
                        });
        }

        /**
         * Открываем один таб на уровне, остальные закрываем
         * @param {string[]} path Путь, по которому надо открыть таб
         */
        const openTabOneLevel = function (path) {
                const $children = getChildTabs(path.slice(0, path.length - 1));
                const $children_to_close = $children.filter(`[data-tab!="${path.join('/')}"]`);
                const $children_to_show = $children.filter(`[data-tab="${path.join('/')}"]`);
                closeTab($children_to_close);
                openThisTab($children_to_show);
        };

        /**
         * Открвть конкретный таб по пути
         * @param {string[]} real_path Элемент, с который хотим открыть.
         */
        instance.openTab = function (real_path) {
                let $element = $(`[data-tab="${real_path}"]`);
                if ($element.length === 0) {
                        console.error(`Не удалось найти таб "${real_path}"`);
                }
                if ($element.length === 0) {
                        console.error(`Нет таба для показа!`, real_path);
                        return;
                }
                openTab($element);
        };

        instance.openParsedPath = function (path, is_close_if_opened) {
                if (typeof path === "string") {
                        path = path.split('/');
                }
                const tab = new TabItem(path[0], path.length);
                const path_to_open = tab.parsePath(path).result_path;
                const $element = $(`[data-tab="${path_to_open}"]`);
                const is_opened = $element.hasClass('tab_active');
                if (!is_opened) {
                        instance.openTab(path_to_open);
                } else if (is_close_if_opened) {
                        closeTab(path_to_open);
                }
        }

        /**
         * Инит. Развешивает события на странице.
         */
        const init = function () {
                $(document).on('click', '[data-opentab][data-tab-toggle="click"],[data-opentab]:not([data-tab-toggle])', function (e) {
                        const $element = $(e.target).closest('[data-opentab],a[href],[data-stoptab]');
                        if (!$element.data('opentab')) { // Если нам не надо отрабатывать таб т.к. мы запретили это
                                return;
                        }
                        const path = $element.data('opentab').split('/');
                        instance.openParsedPath(path, $element.data('toggle') === 'tab');
                });
                $(document).on('change', '[data-opentab][data-tab-toggle="change"]', function (e) {
                        if ($(e.target).prop('checked')) {
                                const path = $(e.target).closest('[data-opentab]').data('opentab').split('/');
                                instance.openParsedPath(path);
                        }
                });
        };

        init();
};

window.Taber = new taber();
