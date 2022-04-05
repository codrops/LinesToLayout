import { Cursor } from './cursor';
import { preloadImages, preloadFonts } from './utils';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

// intro section
const intro = document.querySelector('.intro');
// an array with the intro text spans that we want to animate (data-direction will define the animation direction)
const introTexts = [...intro.querySelectorAll('.row__text.oh > span')];
// an array with the intro images that will trigger the effect when clicked
const images = [...intro.querySelectorAll('.image')];
// an array with the content sections. These will map with the images (one content element per image)
const contents = [...document.querySelectorAll('.content')];
// an array of arrays for the content text spans (one sub array per content).
let contentTexts = [];
contents.forEach(content => {
    contentTexts.push([...content.querySelectorAll('.oh > span')]);
});
// these will be the area where the intro image will be animated/moved to
const contentRowImages = [...document.querySelectorAll('.content > .content__row--image')];
const contentBackCtrls = [...document.querySelectorAll('.content button.content__back')];

// Opens the content view when clicking on the intro images
const openContent = (image, position) => {
   
    // Other intro images (we'll need to hide them)
    const otherImages = images.filter(el => el != image).map(el => el.querySelector('.image__inner'));
        
    gsap.timeline({
        defaults: {
            duration: 1.1,
            ease: 'power4.inOut',
        }
    })
    .addLabel('start', 0)
    .add(() => {
        // Get state
        const state = Flip.getState(image);
        // Change place
        contentRowImages[position].appendChild(image);
        // Flip
        Flip.from(state, {
            duration: 1.2,
            ease: 'power4.inOut',
            absolute: true
        });
        
        intro.classList.add('intro--close');
        contents[position].classList.add('content--open');
        
        // hide back arrow ctrl
        gsap.set(contentBackCtrls[position], {
            xPercent: 20,
            opacity: 0
        });
        // hide text spans
        gsap.set(contentTexts[position], {
            yPercent: 101
        });
    }, 'start')
    .to([introTexts, otherImages], {
        xPercent: (_,target) => {
            switch (target.dataset.direction) {
                case 'right': return 101;
                case 'left': return -101;
                default: return 0;
            }
        },
        yPercent: (_,target) => {
            switch (target.dataset.direction) {
                case 'top': return -101;
                case 'bottom': return 101;
                default: return 0;
            }
        }
    }, 'start')
    .addLabel('content', 'start+=0.7')
    .to(contentTexts[position], {
        ease: 'expo',
        yPercent: 0
    }, 'content')
    .to(contentBackCtrls[position], {
        ease: 'expo',
        xPercent: 0,
        opacity: 1
    }, 'content');

};

const closeContent = (image, position) => {
    
    // Other intro images (we'll need to hide them)
    const otherImages = images.filter(el => el != image).map(el => el.querySelector('.image__inner'));
        
    gsap.timeline({
        defaults: {
            duration: 1.1,
            ease: 'power4.inOut',
        },
        onComplete: () => {
            intro.classList.remove('intro--close');
            contents[position].classList.remove('content--open');
        }
    })
    .addLabel('start', 0)
    .to(contentTexts[position], {
        duration: 0.8,
        yPercent: 101
    }, 'start')
    .to(contentBackCtrls[position], {
        duration: 0.8,
        xPercent: 20,
        opacity: 0
    }, 'start')
    .add(() => {
        // Get state
        const state = Flip.getState(image);
        // Change place
        intro.appendChild(image);
        // Flip
        Flip.from(state, {
            duration: 1.2,
            ease: 'power4.inOut',
            absolute: true
        });
    }, 'start')
    .addLabel('intro', 'start+=0.6')
    .to([introTexts, otherImages], {
        ease: 'expo',
        xPercent: 0,
        yPercent: 0,
        /*stagger: {
            each: 0.08,
            grid: 'auto',
            from: 'random'
        }*/
    }, 'intro');

};

// Images click event
images.forEach((image, position) => {  
    image.addEventListener('click', () => {
        openContent(image, position);
    });
});

contentBackCtrls.forEach((ctrl, position) => {  
    ctrl.addEventListener('click', () => {
        closeContent(images[position], position);
    });
});

// Initialize custom cursor
new Cursor(document.querySelectorAll('.cursor'), 'a, .intro > .image, .content__back');

// Preload images and fonts and remove loader
Promise.all([
    preloadImages('.image__inner'), 
    preloadFonts('jdl7wqk')
]).then(() => document.body.classList.remove('loading'));