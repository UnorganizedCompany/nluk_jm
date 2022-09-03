
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /* src/Component/List.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1$1, console: console_1$2 } = globals;
    const file$2 = "src/Component/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (56:8) {#each Object.values(list) as row, idx}
    function create_each_block(ctx) {
    	let tr;
    	let td;
    	let t0_value = /*row*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*idx*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(td, file$2, 60, 12, 1987);
    			add_location(tr, file$2, 56, 8, 1884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, t0);
    			append_dev(tr, t1);

    			if (!mounted) {
    				dispose = listen_dev(tr, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*list*/ 1 && t0_value !== (t0_value = /*row*/ ctx[5] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(56:8) {#each Object.values(list) as row, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let table;
    	let tbody;
    	let t1;
    	let div1;
    	let a;
    	let img1;
    	let img1_src_value;
    	let each_value = Object.values(/*list*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			table = element("table");
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			a = element("a");
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "logo.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "200");
    			attr_dev(img0, "draggable", "false");
    			add_location(img0, file$2, 51, 4, 1712);
    			attr_dev(div0, "align", "left");
    			set_style(div0, "margin-bottom", "50px");
    			add_location(div0, file$2, 50, 0, 1661);
    			attr_dev(tbody, "align", "left");
    			add_location(tbody, file$2, 54, 4, 1807);
    			attr_dev(table, "class", "table table-hover");
    			add_location(table, file$2, 53, 0, 1769);
    			attr_dev(img1, "width", "50");
    			if (!src_url_equal(img1.src, img1_src_value = "new.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "href", "#/newdoc");
    			add_location(img1, file$2, 67, 8, 2105);
    			attr_dev(a, "href", "#/newdoc");
    			add_location(a, file$2, 66, 4, 2077);
    			attr_dev(div1, "align", "right");
    			add_location(div1, file$2, 65, 0, 2052);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, img1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectedIdx, onClick, Object, list*/ 7) {
    				each_value = Object.values(/*list*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('List', slots, []);

    	if (!localStorage.pseudo_twitter_list) {
    		localStorage.pseudo_twitter_list = JSON.stringify(["welcome to pseudo_twitter", "taptaptaptaptaptaptaptaptaptap"]);
    	}

    	var list = JSON.parse(localStorage.pseudo_twitter_list);

    	if (!list || list.length == 0) {
    		list = JSON.parse(localStorage.pseudo_twitter_list);
    	}

    	var selectedIdx = -1;
    	var clicked = [];

    	function onClick() {
    		clicked.push([selectedIdx, Date.now()]);
    		console.log({ clicked });
    		var len = clicked.length;

    		if (len < 10) {
    			return;
    		}

    		var achieved = true;
    		var lastSelected = -1;
    		var firstClicked = -1;
    		var lastClicked = -1;

    		for (var i = len - 10; i < len; i++) {
    			if (i == len - 10) {
    				lastSelected = clicked[i][0];
    				firstClicked = clicked[i][1];
    				continue;
    			}

    			if (lastSelected != clicked[i][0]) {
    				achieved = false;
    				break;
    			}

    			if (i == len - 1) {
    				lastClicked = clicked[i][1];
    			}
    		}

    		console.log(lastClicked - firstClicked);
    		achieved = achieved && lastClicked - firstClicked < 2000;

    		if (achieved) {
    			alert("abra-cadabra");
    			list.splice(lastSelected, 1);
    			localStorage.pseudo_twitter_list = JSON.stringify(list);
    			location.reload();
    		}
    	}

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	const click_handler = idx => {
    		$$invalidate(1, selectedIdx = idx);
    		onClick();
    	};

    	$$self.$capture_state = () => ({ list, selectedIdx, clicked, onClick });

    	$$self.$inject_state = $$props => {
    		if ('list' in $$props) $$invalidate(0, list = $$props.list);
    		if ('selectedIdx' in $$props) $$invalidate(1, selectedIdx = $$props.selectedIdx);
    		if ('clicked' in $$props) clicked = $$props.clicked;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [list, selectedIdx, onClick, click_handler];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Component/NewDoc.svelte generated by Svelte v3.48.0 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/Component/NewDoc.svelte";

    function create_fragment$2(ctx) {
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div1;
    	let t1;
    	let t2;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let div4;
    	let t9;
    	let div5;
    	let t11;
    	let div6;
    	let t13;
    	let div7;
    	let t15;
    	let div8;
    	let t17;
    	let div9;
    	let t19;
    	let div10;
    	let t21;
    	let div11;
    	let t23;
    	let div12;
    	let t25;
    	let div13;
    	let t27;
    	let div14;
    	let t29;
    	let div15;
    	let t31;
    	let div16;
    	let t33;
    	let div17;
    	let t35;
    	let div18;
    	let t37;
    	let div19;
    	let t39;
    	let div20;
    	let t41;
    	let div21;
    	let t43;
    	let div22;
    	let t45;
    	let div23;
    	let t47;
    	let div24;
    	let t49;
    	let div25;
    	let t51;
    	let div26;
    	let t53;
    	let div27;
    	let t55;
    	let div28;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			t1 = text(/*text*/ ctx[2]);
    			t2 = space();
    			img1 = element("img");
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "q";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "w";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "e";
    			t9 = space();
    			div5 = element("div");
    			div5.textContent = "r";
    			t11 = space();
    			div6 = element("div");
    			div6.textContent = "t";
    			t13 = space();
    			div7 = element("div");
    			div7.textContent = "y";
    			t15 = space();
    			div8 = element("div");
    			div8.textContent = "u";
    			t17 = space();
    			div9 = element("div");
    			div9.textContent = "i";
    			t19 = space();
    			div10 = element("div");
    			div10.textContent = "o";
    			t21 = space();
    			div11 = element("div");
    			div11.textContent = "p";
    			t23 = space();
    			div12 = element("div");
    			div12.textContent = "a";
    			t25 = space();
    			div13 = element("div");
    			div13.textContent = "s";
    			t27 = space();
    			div14 = element("div");
    			div14.textContent = "d";
    			t29 = space();
    			div15 = element("div");
    			div15.textContent = "f";
    			t31 = space();
    			div16 = element("div");
    			div16.textContent = "g";
    			t33 = space();
    			div17 = element("div");
    			div17.textContent = "h";
    			t35 = space();
    			div18 = element("div");
    			div18.textContent = "j";
    			t37 = space();
    			div19 = element("div");
    			div19.textContent = "k";
    			t39 = space();
    			div20 = element("div");
    			div20.textContent = "l";
    			t41 = space();
    			div21 = element("div");
    			div21.textContent = "z";
    			t43 = space();
    			div22 = element("div");
    			div22.textContent = "x";
    			t45 = space();
    			div23 = element("div");
    			div23.textContent = "c";
    			t47 = space();
    			div24 = element("div");
    			div24.textContent = "v";
    			t49 = space();
    			div25 = element("div");
    			div25.textContent = "b";
    			t51 = space();
    			div26 = element("div");
    			div26.textContent = "n";
    			t53 = space();
    			div27 = element("div");
    			div27.textContent = "m";
    			t55 = space();
    			div28 = element("div");
    			div28.textContent = "return";
    			if (!src_url_equal(img0.src, img0_src_value = "logo.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "200");
    			attr_dev(img0, "draggable", "false");
    			add_location(img0, file$1, 173, 4, 5352);
    			attr_dev(div0, "align", "left");
    			set_style(div0, "margin-bottom", "20px");
    			add_location(div0, file$1, 172, 0, 5301);
    			attr_dev(div1, "id", "drop_zone");
    			attr_dev(div1, "ondragover", "return false");
    			attr_dev(div1, "class", "svelte-1pt3fts");
    			add_location(div1, file$1, 175, 0, 5409);
    			if (!src_url_equal(img1.src, img1_src_value = /*keyboardSrc*/ ctx[9])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "keyboard");
    			attr_dev(img1, "width", "400px");
    			attr_dev(img1, "draggable", "false");
    			add_location(img1, file$1, 191, 0, 5677);
    			attr_dev(div2, "id", "q");
    			set_style(div2, "position", "absolute");
    			set_style(div2, "top", "312px");
    			set_style(div2, "right", "412px");
    			attr_dev(div2, "class", "objects svelte-1pt3fts");
    			attr_dev(div2, "draggable", "true");
    			add_location(div2, file$1, 193, 0, 5750);
    			attr_dev(div3, "id", "w");
    			set_style(div3, "position", "absolute");
    			set_style(div3, "top", "312px");
    			set_style(div3, "right", "372px");
    			attr_dev(div3, "class", "objects svelte-1pt3fts");
    			attr_dev(div3, "draggable", "true");
    			add_location(div3, file$1, 207, 0, 6075);
    			attr_dev(div4, "id", "e");
    			set_style(div4, "position", "absolute");
    			set_style(div4, "top", "312px");
    			set_style(div4, "right", "332px");
    			attr_dev(div4, "class", "objects svelte-1pt3fts");
    			attr_dev(div4, "draggable", "true");
    			add_location(div4, file$1, 221, 0, 6400);
    			attr_dev(div5, "id", "r");
    			set_style(div5, "position", "absolute");
    			set_style(div5, "top", "312px");
    			set_style(div5, "right", "292px");
    			attr_dev(div5, "class", "objects svelte-1pt3fts");
    			attr_dev(div5, "draggable", "true");
    			add_location(div5, file$1, 235, 0, 6725);
    			attr_dev(div6, "id", "t");
    			set_style(div6, "position", "absolute");
    			set_style(div6, "top", "312px");
    			set_style(div6, "right", "252px");
    			attr_dev(div6, "class", "objects svelte-1pt3fts");
    			attr_dev(div6, "draggable", "true");
    			add_location(div6, file$1, 249, 0, 7050);
    			attr_dev(div7, "id", "y");
    			set_style(div7, "position", "absolute");
    			set_style(div7, "top", "312px");
    			set_style(div7, "right", "212px");
    			attr_dev(div7, "class", "objects svelte-1pt3fts");
    			attr_dev(div7, "draggable", "true");
    			add_location(div7, file$1, 263, 0, 7375);
    			attr_dev(div8, "id", "u");
    			set_style(div8, "position", "absolute");
    			set_style(div8, "top", "312px");
    			set_style(div8, "right", "172px");
    			attr_dev(div8, "class", "objects svelte-1pt3fts");
    			attr_dev(div8, "draggable", "true");
    			add_location(div8, file$1, 277, 0, 7700);
    			attr_dev(div9, "id", "i");
    			set_style(div9, "position", "absolute");
    			set_style(div9, "top", "312px");
    			set_style(div9, "right", "132px");
    			attr_dev(div9, "class", "objects svelte-1pt3fts");
    			attr_dev(div9, "draggable", "true");
    			add_location(div9, file$1, 291, 0, 8025);
    			attr_dev(div10, "id", "o");
    			set_style(div10, "position", "absolute");
    			set_style(div10, "top", "312px");
    			set_style(div10, "right", "92px");
    			attr_dev(div10, "class", "objects svelte-1pt3fts");
    			attr_dev(div10, "draggable", "true");
    			add_location(div10, file$1, 305, 0, 8350);
    			attr_dev(div11, "id", "p");
    			set_style(div11, "position", "absolute");
    			set_style(div11, "top", "312px");
    			set_style(div11, "right", "52px");
    			attr_dev(div11, "class", "objects svelte-1pt3fts");
    			attr_dev(div11, "draggable", "true");
    			add_location(div11, file$1, 319, 0, 8674);
    			attr_dev(div12, "id", "a");
    			set_style(div12, "position", "absolute");
    			set_style(div12, "top", "365px");
    			set_style(div12, "right", "392px");
    			attr_dev(div12, "class", "objects svelte-1pt3fts");
    			attr_dev(div12, "draggable", "true");
    			add_location(div12, file$1, 334, 0, 8999);
    			attr_dev(div13, "id", "s");
    			set_style(div13, "position", "absolute");
    			set_style(div13, "top", "365px");
    			set_style(div13, "right", "352px");
    			attr_dev(div13, "class", "objects svelte-1pt3fts");
    			attr_dev(div13, "draggable", "true");
    			add_location(div13, file$1, 348, 0, 9324);
    			attr_dev(div14, "id", "d");
    			set_style(div14, "position", "absolute");
    			set_style(div14, "top", "365px");
    			set_style(div14, "right", "312px");
    			attr_dev(div14, "class", "objects svelte-1pt3fts");
    			attr_dev(div14, "draggable", "true");
    			add_location(div14, file$1, 362, 0, 9650);
    			attr_dev(div15, "id", "f");
    			set_style(div15, "position", "absolute");
    			set_style(div15, "top", "365px");
    			set_style(div15, "right", "272px");
    			attr_dev(div15, "class", "objects svelte-1pt3fts");
    			attr_dev(div15, "draggable", "true");
    			add_location(div15, file$1, 376, 0, 9976);
    			attr_dev(div16, "id", "g");
    			set_style(div16, "position", "absolute");
    			set_style(div16, "top", "365px");
    			set_style(div16, "right", "232px");
    			attr_dev(div16, "class", "objects svelte-1pt3fts");
    			attr_dev(div16, "draggable", "true");
    			add_location(div16, file$1, 390, 0, 10302);
    			attr_dev(div17, "id", "h");
    			set_style(div17, "position", "absolute");
    			set_style(div17, "top", "365px");
    			set_style(div17, "right", "192px");
    			attr_dev(div17, "class", "objects svelte-1pt3fts");
    			attr_dev(div17, "draggable", "true");
    			add_location(div17, file$1, 404, 0, 10628);
    			attr_dev(div18, "id", "j");
    			set_style(div18, "position", "absolute");
    			set_style(div18, "top", "365px");
    			set_style(div18, "right", "152px");
    			attr_dev(div18, "class", "objects svelte-1pt3fts");
    			attr_dev(div18, "draggable", "true");
    			add_location(div18, file$1, 418, 0, 10954);
    			attr_dev(div19, "id", "k");
    			set_style(div19, "position", "absolute");
    			set_style(div19, "top", "365px");
    			set_style(div19, "right", "112px");
    			attr_dev(div19, "class", "objects svelte-1pt3fts");
    			attr_dev(div19, "draggable", "true");
    			add_location(div19, file$1, 432, 0, 11280);
    			attr_dev(div20, "id", "l");
    			set_style(div20, "position", "absolute");
    			set_style(div20, "top", "365px");
    			set_style(div20, "right", "72px");
    			attr_dev(div20, "class", "objects svelte-1pt3fts");
    			attr_dev(div20, "draggable", "true");
    			add_location(div20, file$1, 446, 0, 11606);
    			attr_dev(div21, "id", "z");
    			set_style(div21, "position", "absolute");
    			set_style(div21, "top", "420px");
    			set_style(div21, "right", "352px");
    			attr_dev(div21, "class", "objects svelte-1pt3fts");
    			attr_dev(div21, "draggable", "true");
    			add_location(div21, file$1, 460, 0, 11931);
    			attr_dev(div22, "id", "x");
    			set_style(div22, "position", "absolute");
    			set_style(div22, "top", "420px");
    			set_style(div22, "right", "312px");
    			attr_dev(div22, "class", "objects svelte-1pt3fts");
    			attr_dev(div22, "draggable", "true");
    			add_location(div22, file$1, 474, 0, 12257);
    			attr_dev(div23, "id", "c");
    			set_style(div23, "position", "absolute");
    			set_style(div23, "top", "420px");
    			set_style(div23, "right", "272px");
    			attr_dev(div23, "class", "objects svelte-1pt3fts");
    			attr_dev(div23, "draggable", "true");
    			add_location(div23, file$1, 488, 0, 12583);
    			attr_dev(div24, "id", "v");
    			set_style(div24, "position", "absolute");
    			set_style(div24, "top", "420px");
    			set_style(div24, "right", "232px");
    			attr_dev(div24, "class", "objects svelte-1pt3fts");
    			attr_dev(div24, "draggable", "true");
    			add_location(div24, file$1, 502, 0, 12909);
    			attr_dev(div25, "id", "b");
    			set_style(div25, "position", "absolute");
    			set_style(div25, "top", "420px");
    			set_style(div25, "right", "192px");
    			attr_dev(div25, "class", "objects svelte-1pt3fts");
    			attr_dev(div25, "draggable", "true");
    			add_location(div25, file$1, 516, 0, 13235);
    			attr_dev(div26, "id", "n");
    			set_style(div26, "position", "absolute");
    			set_style(div26, "top", "420px");
    			set_style(div26, "right", "152px");
    			attr_dev(div26, "class", "objects svelte-1pt3fts");
    			attr_dev(div26, "draggable", "true");
    			add_location(div26, file$1, 530, 0, 13561);
    			attr_dev(div27, "id", "m");
    			set_style(div27, "position", "absolute");
    			set_style(div27, "top", "420px");
    			set_style(div27, "right", "112px");
    			attr_dev(div27, "class", "objects svelte-1pt3fts");
    			attr_dev(div27, "draggable", "true");
    			add_location(div27, file$1, 544, 0, 13887);
    			attr_dev(div28, "id", "return");
    			set_style(div28, "position", "absolute");
    			set_style(div28, "top", "480px");
    			set_style(div28, "right", "52px");
    			attr_dev(div28, "class", "return svelte-1pt3fts");
    			attr_dev(div28, "draggable", "true");
    			add_location(div28, file$1, 558, 0, 14213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t1);
    			/*div1_binding*/ ctx[10](div1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, img1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			/*div2_binding*/ ctx[11](div2);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div3, anchor);
    			/*div3_binding*/ ctx[12](div3);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div4, anchor);
    			/*div4_binding*/ ctx[13](div4);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div5, anchor);
    			/*div5_binding*/ ctx[14](div5);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div6, anchor);
    			/*div6_binding*/ ctx[15](div6);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div7, anchor);
    			/*div7_binding*/ ctx[16](div7);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div8, anchor);
    			/*div8_binding*/ ctx[17](div8);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div9, anchor);
    			/*div9_binding*/ ctx[18](div9);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div10, anchor);
    			/*div10_binding*/ ctx[19](div10);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, div11, anchor);
    			/*div11_binding*/ ctx[20](div11);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, div12, anchor);
    			/*div12_binding*/ ctx[21](div12);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, div13, anchor);
    			/*div13_binding*/ ctx[22](div13);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, div14, anchor);
    			/*div14_binding*/ ctx[23](div14);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, div15, anchor);
    			/*div15_binding*/ ctx[24](div15);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, div16, anchor);
    			/*div16_binding*/ ctx[25](div16);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, div17, anchor);
    			/*div17_binding*/ ctx[26](div17);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, div18, anchor);
    			/*div18_binding*/ ctx[27](div18);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, div19, anchor);
    			/*div19_binding*/ ctx[28](div19);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, div20, anchor);
    			/*div20_binding*/ ctx[29](div20);
    			insert_dev(target, t41, anchor);
    			insert_dev(target, div21, anchor);
    			/*div21_binding*/ ctx[30](div21);
    			insert_dev(target, t43, anchor);
    			insert_dev(target, div22, anchor);
    			/*div22_binding*/ ctx[31](div22);
    			insert_dev(target, t45, anchor);
    			insert_dev(target, div23, anchor);
    			/*div23_binding*/ ctx[32](div23);
    			insert_dev(target, t47, anchor);
    			insert_dev(target, div24, anchor);
    			/*div24_binding*/ ctx[33](div24);
    			insert_dev(target, t49, anchor);
    			insert_dev(target, div25, anchor);
    			/*div25_binding*/ ctx[34](div25);
    			insert_dev(target, t51, anchor);
    			insert_dev(target, div26, anchor);
    			/*div26_binding*/ ctx[35](div26);
    			insert_dev(target, t53, anchor);
    			insert_dev(target, div27, anchor);
    			/*div27_binding*/ ctx[36](div27);
    			insert_dev(target, t55, anchor);
    			insert_dev(target, div28, anchor);
    			/*div28_binding*/ ctx[37](div28);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "dragenter", handleDragEnter, false, false, false),
    					listen_dev(div1, "dragleave", handleDragLeave, false, false, false),
    					listen_dev(div1, "drop", /*handleDragDrop*/ ctx[3], false, false, false),
    					listen_dev(div2, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div2, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div2, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div2, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div2, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div3, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div3, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div3, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div3, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div3, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div4, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div4, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div4, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div4, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div4, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div5, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div5, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div5, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div5, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div5, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div6, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div6, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div6, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div6, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div6, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div7, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div7, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div7, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div7, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div7, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div8, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div8, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div8, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div8, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div8, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div9, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div9, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div9, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div9, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div9, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div10, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div10, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div10, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div10, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div10, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div11, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div11, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div11, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div11, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div11, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div12, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div12, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div12, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div12, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div12, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div13, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div13, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div13, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div13, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div13, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div14, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div14, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div14, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div14, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div14, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div15, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div15, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div15, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div15, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div15, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div16, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div16, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div16, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div16, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div16, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div17, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div17, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div17, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div17, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div17, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div18, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div18, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div18, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div18, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div18, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div19, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div19, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div19, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div19, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div19, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div20, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div20, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div20, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div20, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div20, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div21, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div21, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div21, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div21, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div21, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div22, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div22, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div22, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div22, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div22, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div23, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div23, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div23, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div23, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div23, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div24, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div24, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div24, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div24, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div24, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div25, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div25, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div25, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div25, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div25, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div26, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div26, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div26, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div26, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div26, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div27, "dragstart", handleDragStart, false, false, false),
    					listen_dev(div27, "dragend", /*handleDragEnd*/ ctx[4], false, false, false),
    					listen_dev(div27, "touchstart", /*handleTouchStart*/ ctx[5], false, false, false),
    					listen_dev(div27, "touchmove", /*handleTouchMove*/ ctx[6], false, false, false),
    					listen_dev(div27, "touchend", /*handleTouchEnd*/ ctx[7], false, false, false),
    					listen_dev(div28, "click", /*onReturnClicked*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*text*/ 4) set_data_dev(t1, /*text*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			/*div1_binding*/ ctx[10](null);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(img1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			/*div2_binding*/ ctx[11](null);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div3);
    			/*div3_binding*/ ctx[12](null);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div4);
    			/*div4_binding*/ ctx[13](null);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div5);
    			/*div5_binding*/ ctx[14](null);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div6);
    			/*div6_binding*/ ctx[15](null);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div7);
    			/*div7_binding*/ ctx[16](null);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div8);
    			/*div8_binding*/ ctx[17](null);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div9);
    			/*div9_binding*/ ctx[18](null);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div10);
    			/*div10_binding*/ ctx[19](null);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(div11);
    			/*div11_binding*/ ctx[20](null);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(div12);
    			/*div12_binding*/ ctx[21](null);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(div13);
    			/*div13_binding*/ ctx[22](null);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(div14);
    			/*div14_binding*/ ctx[23](null);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(div15);
    			/*div15_binding*/ ctx[24](null);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(div16);
    			/*div16_binding*/ ctx[25](null);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(div17);
    			/*div17_binding*/ ctx[26](null);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(div18);
    			/*div18_binding*/ ctx[27](null);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(div19);
    			/*div19_binding*/ ctx[28](null);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(div20);
    			/*div20_binding*/ ctx[29](null);
    			if (detaching) detach_dev(t41);
    			if (detaching) detach_dev(div21);
    			/*div21_binding*/ ctx[30](null);
    			if (detaching) detach_dev(t43);
    			if (detaching) detach_dev(div22);
    			/*div22_binding*/ ctx[31](null);
    			if (detaching) detach_dev(t45);
    			if (detaching) detach_dev(div23);
    			/*div23_binding*/ ctx[32](null);
    			if (detaching) detach_dev(t47);
    			if (detaching) detach_dev(div24);
    			/*div24_binding*/ ctx[33](null);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(div25);
    			/*div25_binding*/ ctx[34](null);
    			if (detaching) detach_dev(t51);
    			if (detaching) detach_dev(div26);
    			/*div26_binding*/ ctx[35](null);
    			if (detaching) detach_dev(t53);
    			if (detaching) detach_dev(div27);
    			/*div27_binding*/ ctx[36](null);
    			if (detaching) detach_dev(t55);
    			if (detaching) detach_dev(div28);
    			/*div28_binding*/ ctx[37](null);
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

    function handleDragEnter(e) {
    	
    }

    function handleDragLeave(e) {
    	
    }

    function handleDragStart(e) {
    	status = "Dragging the element " + e.target.getAttribute("id");
    	e.dataTransfer.dropEffect = "move";
    	e.dataTransfer.setData("text", e.target.getAttribute("id"));
    }

    function detectTouchEnd(x1, y1, x2, y2, w, h) {
    	//Very simple detection here
    	if (x2 - x1 > 2 * w) return false;

    	if (y2 - y1 > 2 * h) return false;
    	return true;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NewDoc', slots, []);
    	let drop_zone;

    	let objects = [
    		{ el: null, id: "q" },
    		{ el: null, id: "w" },
    		{ el: null, id: "e" },
    		{ el: null, id: "r" },
    		{ el: null, id: "t" },
    		{ el: null, id: "y" },
    		{ el: null, id: "u" },
    		{ el: null, id: "i" },
    		{ el: null, id: "o" },
    		{ el: null, id: "p" },
    		{ el: null, id: "a" },
    		{ el: null, id: "s" },
    		{ el: null, id: "d" },
    		{ el: null, id: "f" },
    		{ el: null, id: "g" },
    		{ el: null, id: "h" },
    		{ el: null, id: "j" },
    		{ el: null, id: "k" },
    		{ el: null, id: "l" },
    		{ el: null, id: "z" },
    		{ el: null, id: "x" },
    		{ el: null, id: "c" },
    		{ el: null, id: "v" },
    		{ el: null, id: "b" },
    		{ el: null, id: "n" },
    		{ el: null, id: "m" },
    		{ el: null, id: "return" }
    	];

    	let dropped = [];
    	let text = "";
    	let dropped_in = "";
    	let activeEvent = "";
    	let originalX = "";
    	let originalY = "";

    	let originalPos = {
    		"q": { "x": "50px", "y": "312px" },
    		"w": { "x": "90px", "y": "312px" },
    		"e": { "x": "130px", "y": "312px" },
    		"r": { "x": "170px", "y": "312px" },
    		"t": { "x": "210px", "y": "312px" },
    		"y": { "x": "250px", "y": "312px" },
    		"u": { "x": "290px", "y": "312px" },
    		"i": { "x": "330px", "y": "312px" },
    		"o": { "x": "370px", "y": "312px" },
    		"p": { "x": "410px", "y": "312px" },
    		"a": { "x": "70px", "y": "365px" },
    		"s": { "x": "110px", "y": "365px" },
    		"d": { "x": "150px", "y": "365px" },
    		"f": { "x": "190px", "y": "365px" },
    		"g": { "x": "230px", "y": "365px" },
    		"h": { "x": "270px", "y": "365px" },
    		"j": { "x": "310px", "y": "365px" },
    		"k": { "x": "350px", "y": "365px" },
    		"l": { "x": "390px", "y": "365px" },
    		"z": { "x": "110px", "y": "420px" },
    		"x": { "x": "150px", "y": "420px" },
    		"c": { "x": "190px", "y": "420px" },
    		"v": { "x": "230px", "y": "420px" },
    		"b": { "x": "270px", "y": "420px" },
    		"n": { "x": "310px", "y": "420px" },
    		"m": { "x": "350px", "y": "420px" }
    	};

    	function handleDragDrop(e) {
    		e.preventDefault();
    		var element_id = e.dataTransfer.getData("text");
    		dropped = dropped.concat(element_id);
    		dropped_in = true;
    		status = "You droped " + element_id + " into drop zone";
    	}

    	function handleDragEnd(e) {
    		if (dropped_in == false) {
    			status = "You let the " + e.target.getAttribute("id") + " go.";
    		}

    		dropped_in = false;
    	}

    	function handleTouchStart(e) {
    		status = "Touch start with element " + e.target.getAttribute("id");
    		console.log(e.target.offsetLeft, e.target.offsetTop);
    		originalX = e.target.offsetLeft + "px";
    		originalY = e.target.offsetTop + "px";
    		activeEvent = "start";
    	}

    	function handleTouchMove(e) {
    		let touchLocation = e.targetTouches[0];
    		let pageX = Math.floor(touchLocation.pageX - 10) + "px";
    		let pageY = Math.floor(touchLocation.pageY - 10) + "px";
    		status = "Touch x " + pageX + " Touch y " + pageY;
    		e.target.style.position = "absolute";
    		e.target.style.left = pageX;
    		e.target.style.top = pageY;
    		activeEvent = "move";
    	}

    	function handleTouchEnd(e) {
    		e.preventDefault();

    		if (activeEvent === "move") {
    			let pageX = parseInt(e.target.style.left) - 50;
    			let pageY = parseInt(e.target.style.top) - 50;

    			if (detectTouchEnd(drop_zone.offsetLeft, drop_zone.offsetTop, pageX, pageY, drop_zone.offsetWidth, drop_zone.offsetHeight)) {
    				dropped = dropped.concat(e.target.id);
    				$$invalidate(2, text += e.target.id);
    				e.target.style.position = "initial";
    				dropped_in = true;
    				status = "You dropped " + e.target.getAttribute("id") + " into drop zone";
    			}

    			e.target.style.left = originalPos[e.target.id].x;
    			e.target.style.top = originalPos[e.target.id].y;
    			e.target.style.position = "absolute";
    		}
    	}

    	function onReturnClicked() {
    		console.log("return clicked");
    		console.log(text);
    		var list = JSON.parse(localStorage.pseudo_twitter_list);
    		list.push(text);
    		localStorage.pseudo_twitter_list = JSON.stringify(list);
    		window.location.href = "/";
    	}

    	let keyboardSrc = "keyboard2.png";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<NewDoc> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			drop_zone = $$value;
    			$$invalidate(0, drop_zone);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[0].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[0].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[1].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div5_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[2].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div6_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[3].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div7_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[4].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div8_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[5].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div9_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[6].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div10_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[7].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div11_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[8].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div12_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[9].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div13_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[10].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div14_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[11].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div15_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[12].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div16_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[13].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div17_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[14].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div18_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[15].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div19_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[16].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div20_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[17].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div21_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[18].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div22_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[19].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div23_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[20].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div24_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[21].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div25_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[22].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div26_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[23].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div27_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[24].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	function div28_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			objects[25].el = $$value;
    			$$invalidate(1, objects);
    		});
    	}

    	$$self.$capture_state = () => ({
    		drop_zone,
    		objects,
    		dropped,
    		text,
    		dropped_in,
    		activeEvent,
    		originalX,
    		originalY,
    		originalPos,
    		handleDragEnter,
    		handleDragLeave,
    		handleDragDrop,
    		handleDragStart,
    		handleDragEnd,
    		handleTouchStart,
    		handleTouchMove,
    		handleTouchEnd,
    		detectTouchEnd,
    		onReturnClicked,
    		keyboardSrc
    	});

    	$$self.$inject_state = $$props => {
    		if ('drop_zone' in $$props) $$invalidate(0, drop_zone = $$props.drop_zone);
    		if ('objects' in $$props) $$invalidate(1, objects = $$props.objects);
    		if ('dropped' in $$props) dropped = $$props.dropped;
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('dropped_in' in $$props) dropped_in = $$props.dropped_in;
    		if ('activeEvent' in $$props) activeEvent = $$props.activeEvent;
    		if ('originalX' in $$props) originalX = $$props.originalX;
    		if ('originalY' in $$props) originalY = $$props.originalY;
    		if ('originalPos' in $$props) originalPos = $$props.originalPos;
    		if ('keyboardSrc' in $$props) $$invalidate(9, keyboardSrc = $$props.keyboardSrc);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		drop_zone,
    		objects,
    		text,
    		handleDragDrop,
    		handleDragEnd,
    		handleTouchStart,
    		handleTouchMove,
    		handleTouchEnd,
    		onReturnClicked,
    		keyboardSrc,
    		div1_binding,
    		div2_binding,
    		div3_binding,
    		div4_binding,
    		div5_binding,
    		div6_binding,
    		div7_binding,
    		div8_binding,
    		div9_binding,
    		div10_binding,
    		div11_binding,
    		div12_binding,
    		div13_binding,
    		div14_binding,
    		div15_binding,
    		div16_binding,
    		div17_binding,
    		div18_binding,
    		div19_binding,
    		div20_binding,
    		div21_binding,
    		div22_binding,
    		div23_binding,
    		div24_binding,
    		div25_binding,
    		div26_binding,
    		div27_binding,
    		div28_binding
    	];
    }

    class NewDoc extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewDoc",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.48.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (251:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location: location$1,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let link;
    	let t;
    	let main;
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			link = element("link");
    			t = space();
    			main = element("main");
    			create_component(router.$$.fragment);
    			attr_dev(link, "href", "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "integrity", "sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC");
    			attr_dev(link, "crossorigin", "anonymous");
    			add_location(link, file, 11, 0, 432);
    			attr_dev(main, "class", "svelte-sow00n");
    			add_location(main, file, 13, 0, 644);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main);
    			destroy_component(router);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const routes = { '/': List, '/newdoc': NewDoc };
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ List, NewDoc, Router, routes });
    	return [routes];
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
