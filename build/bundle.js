
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Input.svelte generated by Svelte v3.46.2 */

    const file$2 = "src\\Input.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let span;
    	let t1;
    	let button;
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let t2;
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "輸入";
    			t1 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t2 = space();
    			textarea = element("textarea");
    			attr_dev(span, "class", "lead");
    			add_location(span, file$2, 12, 2, 188);
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "d", "M16 1.75V3h5.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H8V1.75C8 .784 8.784 0 9.75 0h4.5C15.216 0 16 .784 16 1.75zm-6.5 0a.25.25 0 01.25-.25h4.5a.25.25 0 01.25.25V3h-5V1.75z");
    			add_location(path0, file$2, 20, 6, 425);
    			attr_dev(path1, "d", "M4.997 6.178a.75.75 0 10-1.493.144L4.916 20.92a1.75 1.75 0 001.742 1.58h10.684a1.75 1.75 0 001.742-1.581l1.413-14.597a.75.75 0 00-1.494-.144l-1.412 14.596a.25.25 0 01-.249.226H6.658a.25.25 0 01-.249-.226L4.997 6.178z");
    			add_location(path1, file$2, 24, 6, 663);
    			attr_dev(path2, "d", "M9.206 7.501a.75.75 0 01.793.705l.5 8.5A.75.75 0 119 16.794l-.5-8.5a.75.75 0 01.705-.793zm6.293.793A.75.75 0 1014 8.206l-.5 8.5a.75.75 0 001.498.088l.5-8.5z");
    			add_location(path2, file$2, 27, 6, 916);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			add_location(svg, file$2, 14, 5, 300);
    			attr_dev(button, "id", "clear");
    			attr_dev(button, "class", "margin-left-m button-xs");
    			add_location(button, file$2, 13, 2, 220);
    			attr_dev(div, "class", "flex align-items-center");
    			add_location(div, file$2, 11, 0, 147);
    			attr_dev(textarea, "id", "input");
    			attr_dev(textarea, "cols", "50");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$2, 33, 0, 1136);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, textarea, anchor);
    			/*textarea_binding*/ ctx[3](textarea);
    			set_input_value(textarea, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*handleClear*/ ctx[2], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) {
    				set_input_value(textarea, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(textarea);
    			/*textarea_binding*/ ctx[3](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Input', slots, []);
    	let { value = "" } = $$props;
    	let textareaEl;

    	function handleClear() {
    		$$invalidate(0, value = "");
    		textareaEl.focus();
    	}

    	const writable_props = ['value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			textareaEl = $$value;
    			$$invalidate(1, textareaEl);
    		});
    	}

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ value, textareaEl, handleClear });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('textareaEl' in $$props) $$invalidate(1, textareaEl = $$props.textareaEl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, textareaEl, handleClear, textarea_binding, textarea_input_handler];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*!
     * clipboard.js v2.0.8
     * https://clipboardjs.com/
     *
     * Licensed MIT © Zeno Rocha
     */

    var clipboard = createCommonjsModule(function (module, exports) {
    (function webpackUniversalModuleDefinition(root, factory) {
    	module.exports = factory();
    })(commonjsGlobal, function() {
    return /******/ (function() { // webpackBootstrap
    /******/ 	var __webpack_modules__ = ({

    /***/ 134:
    /***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

    // EXPORTS
    __webpack_require__.d(__webpack_exports__, {
      "default": function() { return /* binding */ clipboard; }
    });

    // EXTERNAL MODULE: ./node_modules/tiny-emitter/index.js
    var tiny_emitter = __webpack_require__(279);
    var tiny_emitter_default = /*#__PURE__*/__webpack_require__.n(tiny_emitter);
    // EXTERNAL MODULE: ./node_modules/good-listener/src/listen.js
    var listen = __webpack_require__(370);
    var listen_default = /*#__PURE__*/__webpack_require__.n(listen);
    // EXTERNAL MODULE: ./node_modules/select/src/select.js
    var src_select = __webpack_require__(817);
    var select_default = /*#__PURE__*/__webpack_require__.n(src_select);
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }


    /**
     * Inner class which performs selection from either `text` or `target`
     * properties and then executes copy or cut operations.
     */

    var ClipboardAction = /*#__PURE__*/function () {
      /**
       * @param {Object} options
       */
      function ClipboardAction(options) {
        _classCallCheck(this, ClipboardAction);

        this.resolveOptions(options);
        this.initSelection();
      }
      /**
       * Defines base properties passed from constructor.
       * @param {Object} options
       */


      _createClass(ClipboardAction, [{
        key: "resolveOptions",
        value: function resolveOptions() {
          var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          this.action = options.action;
          this.container = options.container;
          this.emitter = options.emitter;
          this.target = options.target;
          this.text = options.text;
          this.trigger = options.trigger;
          this.selectedText = '';
        }
        /**
         * Decides which selection strategy is going to be applied based
         * on the existence of `text` and `target` properties.
         */

      }, {
        key: "initSelection",
        value: function initSelection() {
          if (this.text) {
            this.selectFake();
          } else if (this.target) {
            this.selectTarget();
          }
        }
        /**
         * Creates a fake textarea element, sets its value from `text` property,
         */

      }, {
        key: "createFakeElement",
        value: function createFakeElement() {
          var isRTL = document.documentElement.getAttribute('dir') === 'rtl';
          this.fakeElem = document.createElement('textarea'); // Prevent zooming on iOS

          this.fakeElem.style.fontSize = '12pt'; // Reset box model

          this.fakeElem.style.border = '0';
          this.fakeElem.style.padding = '0';
          this.fakeElem.style.margin = '0'; // Move element out of screen horizontally

          this.fakeElem.style.position = 'absolute';
          this.fakeElem.style[isRTL ? 'right' : 'left'] = '-9999px'; // Move element to the same position vertically

          var yPosition = window.pageYOffset || document.documentElement.scrollTop;
          this.fakeElem.style.top = "".concat(yPosition, "px");
          this.fakeElem.setAttribute('readonly', '');
          this.fakeElem.value = this.text;
          return this.fakeElem;
        }
        /**
         * Get's the value of fakeElem,
         * and makes a selection on it.
         */

      }, {
        key: "selectFake",
        value: function selectFake() {
          var _this = this;

          var fakeElem = this.createFakeElement();

          this.fakeHandlerCallback = function () {
            return _this.removeFake();
          };

          this.fakeHandler = this.container.addEventListener('click', this.fakeHandlerCallback) || true;
          this.container.appendChild(fakeElem);
          this.selectedText = select_default()(fakeElem);
          this.copyText();
          this.removeFake();
        }
        /**
         * Only removes the fake element after another click event, that way
         * a user can hit `Ctrl+C` to copy because selection still exists.
         */

      }, {
        key: "removeFake",
        value: function removeFake() {
          if (this.fakeHandler) {
            this.container.removeEventListener('click', this.fakeHandlerCallback);
            this.fakeHandler = null;
            this.fakeHandlerCallback = null;
          }

          if (this.fakeElem) {
            this.container.removeChild(this.fakeElem);
            this.fakeElem = null;
          }
        }
        /**
         * Selects the content from element passed on `target` property.
         */

      }, {
        key: "selectTarget",
        value: function selectTarget() {
          this.selectedText = select_default()(this.target);
          this.copyText();
        }
        /**
         * Executes the copy operation based on the current selection.
         */

      }, {
        key: "copyText",
        value: function copyText() {
          var succeeded;

          try {
            succeeded = document.execCommand(this.action);
          } catch (err) {
            succeeded = false;
          }

          this.handleResult(succeeded);
        }
        /**
         * Fires an event based on the copy operation result.
         * @param {Boolean} succeeded
         */

      }, {
        key: "handleResult",
        value: function handleResult(succeeded) {
          this.emitter.emit(succeeded ? 'success' : 'error', {
            action: this.action,
            text: this.selectedText,
            trigger: this.trigger,
            clearSelection: this.clearSelection.bind(this)
          });
        }
        /**
         * Moves focus away from `target` and back to the trigger, removes current selection.
         */

      }, {
        key: "clearSelection",
        value: function clearSelection() {
          if (this.trigger) {
            this.trigger.focus();
          }

          document.activeElement.blur();
          window.getSelection().removeAllRanges();
        }
        /**
         * Sets the `action` to be performed which can be either 'copy' or 'cut'.
         * @param {String} action
         */

      }, {
        key: "destroy",

        /**
         * Destroy lifecycle.
         */
        value: function destroy() {
          this.removeFake();
        }
      }, {
        key: "action",
        set: function set() {
          var action = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'copy';
          this._action = action;

          if (this._action !== 'copy' && this._action !== 'cut') {
            throw new Error('Invalid "action" value, use either "copy" or "cut"');
          }
        }
        /**
         * Gets the `action` property.
         * @return {String}
         */
        ,
        get: function get() {
          return this._action;
        }
        /**
         * Sets the `target` property using an element
         * that will be have its content copied.
         * @param {Element} target
         */

      }, {
        key: "target",
        set: function set(target) {
          if (target !== undefined) {
            if (target && _typeof(target) === 'object' && target.nodeType === 1) {
              if (this.action === 'copy' && target.hasAttribute('disabled')) {
                throw new Error('Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute');
              }

              if (this.action === 'cut' && (target.hasAttribute('readonly') || target.hasAttribute('disabled'))) {
                throw new Error('Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes');
              }

              this._target = target;
            } else {
              throw new Error('Invalid "target" value, use a valid Element');
            }
          }
        }
        /**
         * Gets the `target` property.
         * @return {String|HTMLElement}
         */
        ,
        get: function get() {
          return this._target;
        }
      }]);

      return ClipboardAction;
    }();

    /* harmony default export */ var clipboard_action = (ClipboardAction);
    function clipboard_typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { clipboard_typeof = function _typeof(obj) { return typeof obj; }; } else { clipboard_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return clipboard_typeof(obj); }

    function clipboard_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function clipboard_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function clipboard_createClass(Constructor, protoProps, staticProps) { if (protoProps) clipboard_defineProperties(Constructor.prototype, protoProps); if (staticProps) clipboard_defineProperties(Constructor, staticProps); return Constructor; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (clipboard_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }




    /**
     * Helper function to retrieve attribute value.
     * @param {String} suffix
     * @param {Element} element
     */

    function getAttributeValue(suffix, element) {
      var attribute = "data-clipboard-".concat(suffix);

      if (!element.hasAttribute(attribute)) {
        return;
      }

      return element.getAttribute(attribute);
    }
    /**
     * Base class which takes one or more elements, adds event listeners to them,
     * and instantiates a new `ClipboardAction` on each click.
     */


    var Clipboard = /*#__PURE__*/function (_Emitter) {
      _inherits(Clipboard, _Emitter);

      var _super = _createSuper(Clipboard);

      /**
       * @param {String|HTMLElement|HTMLCollection|NodeList} trigger
       * @param {Object} options
       */
      function Clipboard(trigger, options) {
        var _this;

        clipboard_classCallCheck(this, Clipboard);

        _this = _super.call(this);

        _this.resolveOptions(options);

        _this.listenClick(trigger);

        return _this;
      }
      /**
       * Defines if attributes would be resolved using internal setter functions
       * or custom functions that were passed in the constructor.
       * @param {Object} options
       */


      clipboard_createClass(Clipboard, [{
        key: "resolveOptions",
        value: function resolveOptions() {
          var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          this.action = typeof options.action === 'function' ? options.action : this.defaultAction;
          this.target = typeof options.target === 'function' ? options.target : this.defaultTarget;
          this.text = typeof options.text === 'function' ? options.text : this.defaultText;
          this.container = clipboard_typeof(options.container) === 'object' ? options.container : document.body;
        }
        /**
         * Adds a click event listener to the passed trigger.
         * @param {String|HTMLElement|HTMLCollection|NodeList} trigger
         */

      }, {
        key: "listenClick",
        value: function listenClick(trigger) {
          var _this2 = this;

          this.listener = listen_default()(trigger, 'click', function (e) {
            return _this2.onClick(e);
          });
        }
        /**
         * Defines a new `ClipboardAction` on each click event.
         * @param {Event} e
         */

      }, {
        key: "onClick",
        value: function onClick(e) {
          var trigger = e.delegateTarget || e.currentTarget;

          if (this.clipboardAction) {
            this.clipboardAction = null;
          }

          this.clipboardAction = new clipboard_action({
            action: this.action(trigger),
            target: this.target(trigger),
            text: this.text(trigger),
            container: this.container,
            trigger: trigger,
            emitter: this
          });
        }
        /**
         * Default `action` lookup function.
         * @param {Element} trigger
         */

      }, {
        key: "defaultAction",
        value: function defaultAction(trigger) {
          return getAttributeValue('action', trigger);
        }
        /**
         * Default `target` lookup function.
         * @param {Element} trigger
         */

      }, {
        key: "defaultTarget",
        value: function defaultTarget(trigger) {
          var selector = getAttributeValue('target', trigger);

          if (selector) {
            return document.querySelector(selector);
          }
        }
        /**
         * Returns the support of the given action, or all actions if no action is
         * given.
         * @param {String} [action]
         */

      }, {
        key: "defaultText",

        /**
         * Default `text` lookup function.
         * @param {Element} trigger
         */
        value: function defaultText(trigger) {
          return getAttributeValue('text', trigger);
        }
        /**
         * Destroy lifecycle.
         */

      }, {
        key: "destroy",
        value: function destroy() {
          this.listener.destroy();

          if (this.clipboardAction) {
            this.clipboardAction.destroy();
            this.clipboardAction = null;
          }
        }
      }], [{
        key: "isSupported",
        value: function isSupported() {
          var action = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ['copy', 'cut'];
          var actions = typeof action === 'string' ? [action] : action;
          var support = !!document.queryCommandSupported;
          actions.forEach(function (action) {
            support = support && !!document.queryCommandSupported(action);
          });
          return support;
        }
      }]);

      return Clipboard;
    }((tiny_emitter_default()));

    /* harmony default export */ var clipboard = (Clipboard);

    /***/ }),

    /***/ 828:
    /***/ (function(module) {

    var DOCUMENT_NODE_TYPE = 9;

    /**
     * A polyfill for Element.matches()
     */
    if (typeof Element !== 'undefined' && !Element.prototype.matches) {
        var proto = Element.prototype;

        proto.matches = proto.matchesSelector ||
                        proto.mozMatchesSelector ||
                        proto.msMatchesSelector ||
                        proto.oMatchesSelector ||
                        proto.webkitMatchesSelector;
    }

    /**
     * Finds the closest parent that matches a selector.
     *
     * @param {Element} element
     * @param {String} selector
     * @return {Function}
     */
    function closest (element, selector) {
        while (element && element.nodeType !== DOCUMENT_NODE_TYPE) {
            if (typeof element.matches === 'function' &&
                element.matches(selector)) {
              return element;
            }
            element = element.parentNode;
        }
    }

    module.exports = closest;


    /***/ }),

    /***/ 438:
    /***/ (function(module, __unused_webpack_exports, __webpack_require__) {

    var closest = __webpack_require__(828);

    /**
     * Delegates event to a selector.
     *
     * @param {Element} element
     * @param {String} selector
     * @param {String} type
     * @param {Function} callback
     * @param {Boolean} useCapture
     * @return {Object}
     */
    function _delegate(element, selector, type, callback, useCapture) {
        var listenerFn = listener.apply(this, arguments);

        element.addEventListener(type, listenerFn, useCapture);

        return {
            destroy: function() {
                element.removeEventListener(type, listenerFn, useCapture);
            }
        }
    }

    /**
     * Delegates event to a selector.
     *
     * @param {Element|String|Array} [elements]
     * @param {String} selector
     * @param {String} type
     * @param {Function} callback
     * @param {Boolean} useCapture
     * @return {Object}
     */
    function delegate(elements, selector, type, callback, useCapture) {
        // Handle the regular Element usage
        if (typeof elements.addEventListener === 'function') {
            return _delegate.apply(null, arguments);
        }

        // Handle Element-less usage, it defaults to global delegation
        if (typeof type === 'function') {
            // Use `document` as the first parameter, then apply arguments
            // This is a short way to .unshift `arguments` without running into deoptimizations
            return _delegate.bind(null, document).apply(null, arguments);
        }

        // Handle Selector-based usage
        if (typeof elements === 'string') {
            elements = document.querySelectorAll(elements);
        }

        // Handle Array-like based usage
        return Array.prototype.map.call(elements, function (element) {
            return _delegate(element, selector, type, callback, useCapture);
        });
    }

    /**
     * Finds closest match and invokes callback.
     *
     * @param {Element} element
     * @param {String} selector
     * @param {String} type
     * @param {Function} callback
     * @return {Function}
     */
    function listener(element, selector, type, callback) {
        return function(e) {
            e.delegateTarget = closest(e.target, selector);

            if (e.delegateTarget) {
                callback.call(element, e);
            }
        }
    }

    module.exports = delegate;


    /***/ }),

    /***/ 879:
    /***/ (function(__unused_webpack_module, exports) {

    /**
     * Check if argument is a HTML element.
     *
     * @param {Object} value
     * @return {Boolean}
     */
    exports.node = function(value) {
        return value !== undefined
            && value instanceof HTMLElement
            && value.nodeType === 1;
    };

    /**
     * Check if argument is a list of HTML elements.
     *
     * @param {Object} value
     * @return {Boolean}
     */
    exports.nodeList = function(value) {
        var type = Object.prototype.toString.call(value);

        return value !== undefined
            && (type === '[object NodeList]' || type === '[object HTMLCollection]')
            && ('length' in value)
            && (value.length === 0 || exports.node(value[0]));
    };

    /**
     * Check if argument is a string.
     *
     * @param {Object} value
     * @return {Boolean}
     */
    exports.string = function(value) {
        return typeof value === 'string'
            || value instanceof String;
    };

    /**
     * Check if argument is a function.
     *
     * @param {Object} value
     * @return {Boolean}
     */
    exports.fn = function(value) {
        var type = Object.prototype.toString.call(value);

        return type === '[object Function]';
    };


    /***/ }),

    /***/ 370:
    /***/ (function(module, __unused_webpack_exports, __webpack_require__) {

    var is = __webpack_require__(879);
    var delegate = __webpack_require__(438);

    /**
     * Validates all params and calls the right
     * listener function based on its target type.
     *
     * @param {String|HTMLElement|HTMLCollection|NodeList} target
     * @param {String} type
     * @param {Function} callback
     * @return {Object}
     */
    function listen(target, type, callback) {
        if (!target && !type && !callback) {
            throw new Error('Missing required arguments');
        }

        if (!is.string(type)) {
            throw new TypeError('Second argument must be a String');
        }

        if (!is.fn(callback)) {
            throw new TypeError('Third argument must be a Function');
        }

        if (is.node(target)) {
            return listenNode(target, type, callback);
        }
        else if (is.nodeList(target)) {
            return listenNodeList(target, type, callback);
        }
        else if (is.string(target)) {
            return listenSelector(target, type, callback);
        }
        else {
            throw new TypeError('First argument must be a String, HTMLElement, HTMLCollection, or NodeList');
        }
    }

    /**
     * Adds an event listener to a HTML element
     * and returns a remove listener function.
     *
     * @param {HTMLElement} node
     * @param {String} type
     * @param {Function} callback
     * @return {Object}
     */
    function listenNode(node, type, callback) {
        node.addEventListener(type, callback);

        return {
            destroy: function() {
                node.removeEventListener(type, callback);
            }
        }
    }

    /**
     * Add an event listener to a list of HTML elements
     * and returns a remove listener function.
     *
     * @param {NodeList|HTMLCollection} nodeList
     * @param {String} type
     * @param {Function} callback
     * @return {Object}
     */
    function listenNodeList(nodeList, type, callback) {
        Array.prototype.forEach.call(nodeList, function(node) {
            node.addEventListener(type, callback);
        });

        return {
            destroy: function() {
                Array.prototype.forEach.call(nodeList, function(node) {
                    node.removeEventListener(type, callback);
                });
            }
        }
    }

    /**
     * Add an event listener to a selector
     * and returns a remove listener function.
     *
     * @param {String} selector
     * @param {String} type
     * @param {Function} callback
     * @return {Object}
     */
    function listenSelector(selector, type, callback) {
        return delegate(document.body, selector, type, callback);
    }

    module.exports = listen;


    /***/ }),

    /***/ 817:
    /***/ (function(module) {

    function select(element) {
        var selectedText;

        if (element.nodeName === 'SELECT') {
            element.focus();

            selectedText = element.value;
        }
        else if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
            var isReadOnly = element.hasAttribute('readonly');

            if (!isReadOnly) {
                element.setAttribute('readonly', '');
            }

            element.select();
            element.setSelectionRange(0, element.value.length);

            if (!isReadOnly) {
                element.removeAttribute('readonly');
            }

            selectedText = element.value;
        }
        else {
            if (element.hasAttribute('contenteditable')) {
                element.focus();
            }

            var selection = window.getSelection();
            var range = document.createRange();

            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);

            selectedText = selection.toString();
        }

        return selectedText;
    }

    module.exports = select;


    /***/ }),

    /***/ 279:
    /***/ (function(module) {

    function E () {
      // Keep this empty so it's easier to inherit from
      // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
    }

    E.prototype = {
      on: function (name, callback, ctx) {
        var e = this.e || (this.e = {});

        (e[name] || (e[name] = [])).push({
          fn: callback,
          ctx: ctx
        });

        return this;
      },

      once: function (name, callback, ctx) {
        var self = this;
        function listener () {
          self.off(name, listener);
          callback.apply(ctx, arguments);
        }
        listener._ = callback;
        return this.on(name, listener, ctx);
      },

      emit: function (name) {
        var data = [].slice.call(arguments, 1);
        var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
        var i = 0;
        var len = evtArr.length;

        for (i; i < len; i++) {
          evtArr[i].fn.apply(evtArr[i].ctx, data);
        }

        return this;
      },

      off: function (name, callback) {
        var e = this.e || (this.e = {});
        var evts = e[name];
        var liveEvents = [];

        if (evts && callback) {
          for (var i = 0, len = evts.length; i < len; i++) {
            if (evts[i].fn !== callback && evts[i].fn._ !== callback)
              liveEvents.push(evts[i]);
          }
        }

        // Remove event from queue to prevent memory leak
        // Suggested by https://github.com/lazd
        // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

        (liveEvents.length)
          ? e[name] = liveEvents
          : delete e[name];

        return this;
      }
    };

    module.exports = E;
    module.exports.TinyEmitter = E;


    /***/ })

    /******/ 	});
    /************************************************************************/
    /******/ 	// The module cache
    /******/ 	var __webpack_module_cache__ = {};
    /******/ 	
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/ 		// Check if module is in cache
    /******/ 		if(__webpack_module_cache__[moduleId]) {
    /******/ 			return __webpack_module_cache__[moduleId].exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = __webpack_module_cache__[moduleId] = {
    /******/ 			// no module.id needed
    /******/ 			// no module.loaded needed
    /******/ 			exports: {}
    /******/ 		};
    /******/ 	
    /******/ 		// Execute the module function
    /******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    /******/ 	
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/ 	
    /************************************************************************/
    /******/ 	/* webpack/runtime/compat get default export */
    /******/ 	!function() {
    /******/ 		// getDefaultExport function for compatibility with non-harmony modules
    /******/ 		__webpack_require__.n = function(module) {
    /******/ 			var getter = module && module.__esModule ?
    /******/ 				function() { return module['default']; } :
    /******/ 				function() { return module; };
    /******/ 			__webpack_require__.d(getter, { a: getter });
    /******/ 			return getter;
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/define property getters */
    /******/ 	!function() {
    /******/ 		// define getter functions for harmony exports
    /******/ 		__webpack_require__.d = function(exports, definition) {
    /******/ 			for(var key in definition) {
    /******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
    /******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
    /******/ 				}
    /******/ 			}
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/hasOwnProperty shorthand */
    /******/ 	!function() {
    /******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); };
    /******/ 	}();
    /******/ 	
    /************************************************************************/
    /******/ 	// module exports must be returned from runtime so entry inlining is disabled
    /******/ 	// startup
    /******/ 	// Load entry module and return exports
    /******/ 	return __webpack_require__(134);
    /******/ })()
    .default;
    });
    });

    var ClipboardJS = /*@__PURE__*/getDefaultExportFromCjs(clipboard);

    /* src\Output.svelte generated by Svelte v3.46.2 */
    const file$1 = "src\\Output.svelte";

    // (39:4) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M21.03 5.72a.75.75 0 010 1.06l-11.5 11.5a.75.75 0 01-1.072-.012l-5.5-5.75a.75.75 0 111.084-1.036l4.97 5.195L19.97 5.72a.75.75 0 011.06 0z");
    			add_location(path, file$1, 45, 8, 1418);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			add_location(svg, file$1, 39, 6, 1281);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(39:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:4) {#if showCopy}
    function create_if_block(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "d", "M7.024 3.75c0-.966.784-1.75 1.75-1.75H20.25c.966 0 1.75.784 1.75 1.75v11.498a1.75 1.75 0 01-1.75 1.75H8.774a1.75 1.75 0 01-1.75-1.75V3.75zm1.75-.25a.25.25 0 00-.25.25v11.498c0 .139.112.25.25.25H20.25a.25.25 0 00.25-.25V3.75a.25.25 0 00-.25-.25H8.774z");
    			add_location(path0, file$1, 30, 8, 660);
    			attr_dev(path1, "d", "M1.995 10.749a1.75 1.75 0 011.75-1.751H5.25a.75.75 0 110 1.5H3.745a.25.25 0 00-.25.25L3.5 20.25c0 .138.111.25.25.25h9.5a.25.25 0 00.25-.25v-1.51a.75.75 0 111.5 0v1.51A1.75 1.75 0 0113.25 22h-9.5A1.75 1.75 0 012 20.25l-.005-9.501z");
    			add_location(path1, file$1, 34, 8, 984);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			add_location(svg, file$1, 24, 6, 523);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(24:4) {#if showCopy}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let span;
    	let t1;
    	let button;
    	let t2;
    	let textarea;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*showCopy*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "結果";
    			t1 = space();
    			button = element("button");
    			if_block.c();
    			t2 = space();
    			textarea = element("textarea");
    			attr_dev(span, "class", "lead");
    			add_location(span, file$1, 16, 2, 309);
    			attr_dev(button, "id", "copyBtn");
    			attr_dev(button, "class", "copy margin-left-m button-xs");
    			attr_dev(button, "data-clipboard-target", "#output");
    			add_location(button, file$1, 17, 2, 341);
    			attr_dev(div, "class", "flex align-items-center");
    			add_location(div, file$1, 15, 0, 268);
    			attr_dev(textarea, "id", "output");
    			attr_dev(textarea, "cols", "50");
    			attr_dev(textarea, "rows", "5");
    			textarea.readOnly = true;
    			textarea.value = /*value*/ ctx[0];
    			add_location(textarea, file$1, 53, 0, 1667);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(div, t1);
    			append_dev(div, button);
    			if_block.m(button, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, textarea, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "mouseleave", /*mouseleave_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}

    			if (dirty & /*value*/ 1) {
    				prop_dev(textarea, "value", /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(textarea);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Output', slots, []);
    	let { value = "" } = $$props;
    	let showCopy = true;
    	const clipboard = new ClipboardJS("#copyBtn");

    	clipboard.on("success", function (e) {
    		e.clearSelection();
    		$$invalidate(1, showCopy = false);
    	});

    	const writable_props = ['value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Output> was created with unknown prop '${key}'`);
    	});

    	const mouseleave_handler = () => $$invalidate(1, showCopy = true);

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ ClipboardJS, value, showCopy, clipboard });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('showCopy' in $$props) $$invalidate(1, showCopy = $$props.showCopy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, showCopy, mouseleave_handler];
    }

    class Output extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Output",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get value() {
    		throw new Error("<Output>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Output>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

    var freeGlobal$1 = freeGlobal;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal$1 || freeSelf || Function('return this')();

    var root$1 = root;

    /** Built-in value references. */
    var Symbol$1 = root$1.Symbol;

    var Symbol$2 = Symbol$1;

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto$1.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString$1 = objectProto$1.toString;

    /** Built-in value references. */
    var symToStringTag$1 = Symbol$2 ? Symbol$2.toStringTag : undefined;

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag$1),
          tag = value[symToStringTag$1];

      try {
        value[symToStringTag$1] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString$1.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag$1] = tag;
        } else {
          delete value[symToStringTag$1];
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto.toString;

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }

    /** `Object#toString` result references. */
    var nullTag = '[object Null]',
        undefinedTag = '[object Undefined]';

    /** Built-in value references. */
    var symToStringTag = Symbol$2 ? Symbol$2.toStringTag : undefined;

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag && symToStringTag in Object(value))
        ? getRawTag(value)
        : objectToString(value);
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && baseGetTag(value) == symbolTag);
    }

    /** Used to match a single whitespace character. */
    var reWhitespace = /\s/;

    /**
     * Used by `_.trim` and `_.trimEnd` to get the index of the last non-whitespace
     * character of `string`.
     *
     * @private
     * @param {string} string The string to inspect.
     * @returns {number} Returns the index of the last non-whitespace character.
     */
    function trimmedEndIndex(string) {
      var index = string.length;

      while (index-- && reWhitespace.test(string.charAt(index))) {}
      return index;
    }

    /** Used to match leading whitespace. */
    var reTrimStart = /^\s+/;

    /**
     * The base implementation of `_.trim`.
     *
     * @private
     * @param {string} string The string to trim.
     * @returns {string} Returns the trimmed string.
     */
    function baseTrim(string) {
      return string
        ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, '')
        : string;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = baseTrim(value);
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now = function() {
      return root$1.Date.now();
    };

    var now$1 = now;

    /** Error message constants. */
    var FUNC_ERROR_TEXT$1 = 'Expected a function';

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max,
        nativeMin = Math.min;

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT$1);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            timeWaiting = wait - timeSinceLastCall;

        return maxing
          ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
          : timeWaiting;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now$1();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now$1());
      }

      function debounced() {
        var time = now$1(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            clearTimeout(timerId);
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    /** Error message constants. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed `func` invocations and a `flush` method to
     * immediately invoke them. Provide `options` to indicate whether `func`
     * should be invoked on the leading and/or trailing edge of the `wait`
     * timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
     * jQuery(element).on('click', throttled);
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce(func, wait, {
        'leading': leading,
        'maxWait': wait,
        'trailing': trailing
      });
    }

    /* src\App.svelte generated by Svelte v3.46.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let meta0;
    	let meta1;
    	let meta2;
    	let link0;
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let script4;
    	let script4_src_value;
    	let link1;
    	let link2;
    	let link3;
    	let t0;
    	let main;
    	let div;
    	let h1;
    	let t2;
    	let hr0;
    	let t3;
    	let label1;
    	let t4;
    	let label0;
    	let select;
    	let option0;
    	let option1;
    	let t7;
    	let label2;
    	let t8;
    	let input0;
    	let t9;
    	let hr1;
    	let t10;
    	let input1;
    	let updating_value;
    	let t11;
    	let output;
    	let t12;
    	let footer;
    	let nav;
    	let t13;
    	let a0;
    	let t15;
    	let a1;
    	let current;
    	let mounted;
    	let dispose;

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[10](value);
    	}

    	let input1_props = {};

    	if (/*inputVal*/ ctx[0] !== void 0) {
    		input1_props.value = /*inputVal*/ ctx[0];
    	}

    	input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, 'value', input1_value_binding));

    	output = new Output({
    			props: { value: /*outputVal*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			meta0 = element("meta");
    			meta1 = element("meta");
    			meta2 = element("meta");
    			link0 = element("link");
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			script4 = element("script");
    			link1 = element("link");
    			link2 = element("link");
    			link3 = element("link");
    			t0 = space();
    			main = element("main");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "語氣加強器";
    			t2 = space();
    			hr0 = element("hr");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("驚嘆號種類\r\n      ");
    			label0 = element("label");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "！（全形） ";
    			option1 = element("option");
    			option1.textContent = "!(半形)";
    			t7 = space();
    			label2 = element("label");
    			t8 = text("驚嘆號數量（1~10）\r\n      ");
    			input0 = element("input");
    			t9 = space();
    			hr1 = element("hr");
    			t10 = space();
    			create_component(input1.$$.fragment);
    			t11 = space();
    			create_component(output.$$.fragment);
    			t12 = space();
    			footer = element("footer");
    			nav = element("nav");
    			t13 = text("v1.0 ·\r\n    ");
    			a0 = element("a");
    			a0.textContent = "GitHub";
    			t15 = text("\r\n    ·\r\n    ");
    			a1 = element("a");
    			a1.textContent = "YouTube";
    			attr_dev(meta0, "charset", "utf-8");
    			add_location(meta0, file, 53, 2, 1380);
    			attr_dev(meta1, "http-equiv", "X-UA-Compatible");
    			attr_dev(meta1, "content", "IE=edge");
    			add_location(meta1, file, 54, 2, 1408);
    			attr_dev(meta2, "name", "viewport");
    			attr_dev(meta2, "content", "width=device-width, initial-scale=1, shrink-to-fit=no");
    			add_location(meta2, file, 55, 2, 1467);
    			document.title = "語氣加強器";
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "https://unpkg.com/turretcss/dist/turretcss.min.css");
    			attr_dev(link0, "crossorigin", "anonymous");
    			add_location(link0, file, 61, 2, 1598);
    			if (!src_url_equal(script0.src, script0_src_value = "https://cdnjs.cloudflare.com/ajax/libs/cash/8.1.0/cash.min.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file, 66, 2, 1727);
    			if (!src_url_equal(script1.src, script1_src_value = "https://pulipulichen.github.io/jieba-js/jquery.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file, 68, 2, 1821);
    			if (!src_url_equal(script2.src, script2_src_value = "https://pulipulichen.github.io/jieba-js/require-jieba-js.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file, 69, 2, 1898);
    			if (!src_url_equal(script3.src, script3_src_value = "https://unpkg.com/clipboard@2/dist/clipboard.min.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file, 72, 2, 2027);
    			if (!src_url_equal(script4.src, script4_src_value = "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js")) attr_dev(script4, "src", script4_src_value);
    			attr_dev(script4, "integrity", "sha256-qXBd/EfAdjOA2FGrGAG+b3YBn2tn5A6bhz+LSgYD96k=");
    			attr_dev(script4, "crossorigin", "anonymous");
    			add_location(script4, file, 73, 2, 2106);
    			attr_dev(link1, "rel", "preconnect");
    			attr_dev(link1, "href", "https://fonts.googleapis.com");
    			add_location(link1, file, 77, 2, 2294);
    			attr_dev(link2, "rel", "preconnect");
    			attr_dev(link2, "href", "https://fonts.gstatic.com");
    			attr_dev(link2, "crossorigin", "");
    			add_location(link2, file, 78, 2, 2359);
    			attr_dev(link3, "href", "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap");
    			attr_dev(link3, "rel", "stylesheet");
    			add_location(link3, file, 79, 2, 2433);
    			add_location(h1, file, 87, 4, 2669);
    			add_location(hr0, file, 88, 4, 2689);
    			option0.__value = "！";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file, 93, 10, 2875);
    			option1.__value = "!";
    			option1.value = option1.__value;
    			add_location(option1, file, 94, 10, 2930);
    			attr_dev(select, "class", "select");
    			attr_dev(select, "id", "markType");
    			if (/*markType*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[8].call(select));
    			add_location(select, file, 92, 8, 2804);
    			attr_dev(label0, "class", "select padding-top-xs");
    			add_location(label0, file, 91, 6, 2757);
    			attr_dev(label1, "for", "markType");
    			attr_dev(label1, "class", "lead");
    			add_location(label1, file, 89, 4, 2701);
    			attr_dev(input0, "id", "markNum");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "1");
    			attr_dev(input0, "max", "10");
    			attr_dev(input0, "step", "1");
    			attr_dev(input0, "mark", /*mark*/ ctx[3]);
    			add_location(input0, file, 100, 6, 3080);
    			attr_dev(label2, "for", "markNum");
    			attr_dev(label2, "class", "lead");
    			add_location(label2, file, 98, 4, 3019);
    			add_location(hr1, file, 110, 4, 3259);
    			attr_dev(div, "class", "max-width-xl");
    			add_location(div, file, 86, 2, 2637);
    			attr_dev(main, "class", "margin-m flex justify-content-center svelte-180aane");
    			add_location(main, file, 85, 0, 2582);
    			attr_dev(a0, "href", "https://github.com/FOBshippingpoint/svelte-exclamationer");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file, 118, 4, 3474);
    			attr_dev(a1, "href", "https://www.youtube.com/channel/UC-UzF0F_qnMhwy9oB-DyWsg");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file, 124, 4, 3633);
    			attr_dev(nav, "class", "font-size-s padding-vertical-m");
    			add_location(nav, file, 116, 2, 3412);
    			attr_dev(footer, "class", "background-light text-align-center");
    			add_location(footer, file, 115, 0, 3357);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, meta0);
    			append_dev(document.head, meta1);
    			append_dev(document.head, meta2);
    			append_dev(document.head, link0);
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			append_dev(document.head, script4);
    			append_dev(document.head, link1);
    			append_dev(document.head, link2);
    			append_dev(document.head, link3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(div, t2);
    			append_dev(div, hr0);
    			append_dev(div, t3);
    			append_dev(div, label1);
    			append_dev(label1, t4);
    			append_dev(label1, label0);
    			append_dev(label0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*markType*/ ctx[1]);
    			append_dev(div, t7);
    			append_dev(div, label2);
    			append_dev(label2, t8);
    			append_dev(label2, input0);
    			set_input_value(input0, /*markNum*/ ctx[2]);
    			append_dev(div, t9);
    			append_dev(div, hr1);
    			append_dev(div, t10);
    			mount_component(input1, div, null);
    			append_dev(div, t11);
    			mount_component(output, div, null);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, nav);
    			append_dev(nav, t13);
    			append_dev(nav, a0);
    			append_dev(nav, t15);
    			append_dev(nav, a1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(script2, "load", /*handle_call_jieba_cut*/ ctx[5], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[8]),
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[9]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[9])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*markType*/ 2) {
    				select_option(select, /*markType*/ ctx[1]);
    			}

    			if (!current || dirty & /*mark*/ 8) {
    				attr_dev(input0, "mark", /*mark*/ ctx[3]);
    			}

    			if (dirty & /*markNum*/ 4) {
    				set_input_value(input0, /*markNum*/ ctx[2]);
    			}

    			const input1_changes = {};

    			if (!updating_value && dirty & /*inputVal*/ 1) {
    				updating_value = true;
    				input1_changes.value = /*inputVal*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			input1.$set(input1_changes);
    			const output_changes = {};
    			if (dirty & /*outputVal*/ 16) output_changes.value = /*outputVal*/ ctx[4];
    			output.$set(output_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input1.$$.fragment, local);
    			transition_in(output.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input1.$$.fragment, local);
    			transition_out(output.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(meta0);
    			detach_dev(meta1);
    			detach_dev(meta2);
    			detach_dev(link0);
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			detach_dev(script4);
    			detach_dev(link1);
    			detach_dev(link2);
    			detach_dev(link3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(input1);
    			destroy_component(output);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const END_TAKE = 5;

    function instance($$self, $$props, $$invalidate) {
    	let mark;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let inputVal = "我真的不知道到底是我們跟不上時代，還是年輕人現在都是這樣講話？";
    	let outputVal = "我真的不知道到底是我們跟不上時代！還是年輕人現在都是這樣講！話！！";
    	let markType = "！";
    	let markNum = "1";
    	let toReplace = "";

    	let throttle_call_jieba_cut = () => {
    		
    	};

    	const handle_call_jieba_cut = () => {
    		$$invalidate(7, throttle_call_jieba_cut = throttle(window.call_jieba_cut, 100));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		markType = select_value(this);
    		$$invalidate(1, markType);
    	}

    	function input0_change_input_handler() {
    		markNum = to_number(this.value);
    		$$invalidate(2, markNum);
    	}

    	function input1_value_binding(value) {
    		inputVal = value;
    		$$invalidate(0, inputVal);
    	}

    	$$self.$capture_state = () => ({
    		Input,
    		Output,
    		throttle,
    		inputVal,
    		outputVal,
    		markType,
    		markNum,
    		toReplace,
    		END_TAKE,
    		throttle_call_jieba_cut,
    		handle_call_jieba_cut,
    		mark
    	});

    	$$self.$inject_state = $$props => {
    		if ('inputVal' in $$props) $$invalidate(0, inputVal = $$props.inputVal);
    		if ('outputVal' in $$props) $$invalidate(4, outputVal = $$props.outputVal);
    		if ('markType' in $$props) $$invalidate(1, markType = $$props.markType);
    		if ('markNum' in $$props) $$invalidate(2, markNum = $$props.markNum);
    		if ('toReplace' in $$props) $$invalidate(6, toReplace = $$props.toReplace);
    		if ('throttle_call_jieba_cut' in $$props) $$invalidate(7, throttle_call_jieba_cut = $$props.throttle_call_jieba_cut);
    		if ('mark' in $$props) $$invalidate(3, mark = $$props.mark);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*markType, markNum*/ 6) {
    			$$invalidate(3, mark = markType.repeat(markNum));
    		}

    		if ($$self.$$.dirty & /*inputVal, throttle_call_jieba_cut, mark*/ 137) {
    			{
    				const front = inputVal.substring(0, inputVal.length - END_TAKE);
    				const end = inputVal.substring(inputVal.length - END_TAKE);

    				throttle_call_jieba_cut(end, function (result) {
    					if (!Array.isArray(result)) return;
    					let lastWord;
    					let i = 0;

    					do {
    						lastWord = result[result.length - ++i];
    					} while ((/[,.\?"'~？，。]/).test(lastWord));

    					if (lastWord) {
    						lastWord = lastWord.split("").reduce((acc, curr) => acc + curr + mark, "");
    					} else {
    						lastWord = "";
    					}

    					let last = result.slice(result.length - i + 1);
    					$$invalidate(6, toReplace = front + result.slice(0, -i).join("") + lastWord + last.join(""));
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*toReplace, mark*/ 72) {
    			$$invalidate(4, outputVal = toReplace.replace(/[,.\?"'~？，。]/g, mark));
    		}
    	};

    	return [
    		inputVal,
    		markType,
    		markNum,
    		mark,
    		outputVal,
    		handle_call_jieba_cut,
    		toReplace,
    		throttle_call_jieba_cut,
    		select_change_handler,
    		input0_change_input_handler,
    		input1_value_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
