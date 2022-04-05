import { gsap } from 'gsap';

/**
 * Linear interpolation
 * @param {Number} a - first value to interpolate
 * @param {Number} b - second value to interpolate 
 * @param {Number} n - amount to interpolate
 */
const lerp = (a, b, n) => (1 - n) * a + n * b;

/**
 * Gets the cursor position
 * @param {Event} ev - mousemove event
 */
const getCursorPos = ev => {
	return { 
		x : ev.clientX, 
		y : ev.clientY 
	};
};

// Track the cursor position
let cursor = {x: 0, y: 0};
window.addEventListener('mousemove', ev => cursor = getCursorPos(ev));

/**
 * Class representing a custom cursor.
 * A Cursor can have multiple elements/svgs
 */
export class Cursor {
	// DOM elements
	DOM = {
		// cursor elements (SVGs .cursor)
		elements: null,
	}
	// All CursorElement instances
	cursorElements = [];

	/**
	 * Constructor.
	 * @param {NodeList} Dom_elems - all .cursor elements
	 * @param {String} triggerSelector - Trigger the cursor enter/leave method on the this selector returned elements. Default is all <a>.
	 */
	constructor(Dom_elems, triggerSelector = 'a') {
		this.DOM.elements = Dom_elems;

		[...this.DOM.elements].forEach(el => this.cursorElements.push(new CursorElement(el)));

		[...document.querySelectorAll(triggerSelector)].forEach(link => {
			link.addEventListener('mouseenter', () => this.enter());
			link.addEventListener('mouseleave', () => this.leave());
		});
	}
	/**
	 * Mouseenter event
	 */
	enter() {
		for (const el of this.cursorElements) {
			el.enter();
		}
	}

	/**
	 * Mouseleave event
	 */
	leave() {
		for (const el of this.cursorElements) {
			el.leave();
		}
	}
}

/**
 * Class representing a .cursor element
 */
class CursorElement {
	// DOM elements
	DOM = {
		// Main element (.cursor)
		el: null,
		// Inner element (.cursor__inner)
		inner: null,
		// feTurbulence element
		feTurbulence: null
	}
	// Scales value when entering an <a> element
	radiusOnEnter = 30;
	// Opacity value when entering an <a> element
	opacityOnEnter = 1;
	// radius
	radius;
	// Element style properties
	renderedStyles = {
		// With interpolation, we can achieve a smooth animation effect when moving the cursor. 
		// The "previous" and "current" values are the values that will interpolate. 
		// The returned value will be one between these two (previous and current) at a specific increment. 
		// The "amt" is the amount to interpolate. 
		// As an example, the following formula calculates the x-axis translation value to apply to the cursor element:
		// this.renderedStyles.tx.previous = lerp(this.renderedStyles.tx.previous, this.renderedStyles.tx.current, this.renderedStyles.tx.amt);
		
		// translation, scale and opacity values
		// The lower the amt, the slower the cursor "follows" the user gesture
		tx: {previous: 0, current: 0, amt: 0.2},
		ty: {previous: 0, current: 0, amt: 0.2},
		// The scale and opacity will change when hovering over any element specified in [triggerSelector]
		// Defaults are 1 for both properties
		//scale: {previous: 1, current: 1, amt: 0.2},
		radius: {previous: 20, current: 20, amt: 0.2},
		opacity: {previous: 1, current: 1, amt: 0.2}
	};
	// Element size and position
	bounds;
	// SVG filter id
	filterId = '#cursor-filter';
	// for the filter animation
	primitiveValues = {turbulence: 0};

	/**
	 * Constructor.
	 */
	constructor(DOM_el) {
		this.DOM.el = DOM_el;
		this.DOM.inner = this.DOM.el.querySelector('.cursor__inner');
		this.DOM.feTurbulence = document.querySelector(`${this.filterId} > feTurbulence`);
		
		this.createFilterTimeline();

		// Hide it initially
		this.DOM.el.style.opacity = 0;
		
		// Calculate size and position
		this.bounds = this.DOM.el.getBoundingClientRect();

		// Check if any options passed in data attributes
		this.radiusOnEnter = this.DOM.el.dataset.radiusEnter || this.radiusOnEnter;
		this.opacityOnEnter = this.DOM.el.dataset.opacityEnter || this.opacityOnEnter;
		for (const key in this.renderedStyles) {
			this.renderedStyles[key].amt = this.DOM.el.dataset.amt || this.renderedStyles[key].amt;	
		}

		this.radius = this.DOM.inner.getAttribute('r');
		this.renderedStyles['radius'].previous = this.renderedStyles['radius'].current = this.radius;
		
		// Show the element and start tracking its position as soon as the user moves the cursor.
		const onMouseMoveEv = () => {
			// Set up the initial values to be the same
			this.renderedStyles.tx.previous = this.renderedStyles.tx.current = cursor.x - this.bounds.width/2;
			this.renderedStyles.ty.previous = this.renderedStyles.ty.previous = cursor.y - this.bounds.height/2;
			// Show it
			this.DOM.el.style.opacity = 1;
			// Start rAF loop
			requestAnimationFrame(() => this.render());
			// Remove the initial mousemove event
			window.removeEventListener('mousemove', onMouseMoveEv);
		};
		window.addEventListener('mousemove', onMouseMoveEv);
	}

	/**
	 * Mouseenter event
	 * Scale up and fade out.
	 */
	enter() {
		this.renderedStyles['radius'].current = this.radiusOnEnter;
		this.renderedStyles['opacity'].current = this.opacityOnEnter;

		this.filterTimeline.restart();
	}

	/**
	 * Mouseleave event
	 * Reset scale and opacity.
	 */
	leave() {
		this.renderedStyles['radius'].current = this.radius;
		this.renderedStyles['opacity'].current = 1;

		this.filterTimeline.progress(1).kill();
	}

	createFilterTimeline() {
		this.filterTimeline = gsap.timeline({
			paused: true,
			onStart: () => {
				this.DOM.inner.style.filter = `url(${this.filterId}`;
			},
			onUpdate: () => {
				this.DOM.feTurbulence.setAttribute('baseFrequency', this.primitiveValues.turbulence);
			},
			onComplete: () => {
				this.DOM.inner.style.filter = 'none';
			}
		})
		.to(this.primitiveValues, { 
			duration: 3,
			ease: 'none',
			repeat: -1,
			yoyo: true,
			startAt: {turbulence: 0.15},
			turbulence: 0.13
		});
	}

	/**
	 * Loop / Interpolation
	 */
	render() {
		// New cursor positions
		this.renderedStyles['tx'].current = cursor.x - this.bounds.width/2;
		this.renderedStyles['ty'].current = cursor.y - this.bounds.height/2;
		
		// Interpolation
		for (const key in this.renderedStyles ) {
			this.renderedStyles[key].previous = lerp(this.renderedStyles[key].previous, this.renderedStyles[key].current, this.renderedStyles[key].amt);
		}
		
		// Apply interpolated values (smooth effect)
		this.DOM.el.style.transform = `translateX(${(this.renderedStyles['tx'].previous)}px) translateY(${this.renderedStyles['ty'].previous}px)`;
		this.DOM.inner.setAttribute('r', this.renderedStyles['radius'].previous);
		this.DOM.el.style.opacity = this.renderedStyles['opacity'].previous;

		// loop...
		requestAnimationFrame(() => this.render());
	}
}