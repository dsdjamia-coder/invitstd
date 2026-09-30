const envSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="100%" height="100%" fill="#2A1B18"/>
    <path d="M 40 60 L 200 170 L 360 60 Z" fill="#E8D8C8" stroke="#D4AF37" stroke-width="1.5"/>
    <path d="M 40 60 L 40 240 L 360 240 L 360 60 Z" fill="none" stroke="#D4AF37" stroke-width="1.5"/>
    <circle cx="200" cy="170" r="18" fill="#B33927" stroke="#D4AF37" stroke-width="2"/>
    <text x="200" y="174" dominant-baseline="middle" text-anchor="middle" font-family="'Cinzel', serif" font-size="10" font-weight="bold" fill="#FFEAA7">OPEN</text>
    <text x="50%" y="275" dominant-baseline="middle" text-anchor="middle" font-family="'Cinzel', serif" font-size="12" letter-spacing="3" fill="#D4AF37">INTERACTIVE ENVELOPE</text>
</svg>`;
const envThumb = 'data:image/svg+xml;base64,' + btoa(envSvg);

window.registerTemplate({
    id: 'interactive-envelope-slides',
    name: 'Interactive Wax-Seal Envelope',
    thumb: envThumb,
    freeform: false,
    scrollable: false, // Non-scrolling slides
    defaults: {
        colors: {
            primary: '#B33927',     // Crimson Wax / Burgundy
            bg: '#1A0E0B',          // Dark Velvet Espresso
            text: '#1F2937'         // High contrast text
        },
        fonts: {
            heading: "'Cinzel', serif"
        }
    },
    render: function(d, isEditMode) {
        const colors = {
            primary: d?.design?.colors?.primary || this.defaults.colors.primary,
            bg: d?.design?.colors?.bg || this.defaults.colors.bg,
            text: '#1F2937'
        };
        const set = d?.settings || {};
        const showRsvp = set.showRsvp === true;
        const showPhotos = set.showPhotos === true || Boolean(d?.photosQr || d?.photosLink);

        // Safe HTML escaping helper
        const escape = (val, fallback = '') => String(val ?? fallback)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Edit wrapper helper for Studio
        const edit = (key, contentHtml, visibilityKey) => {
            if (visibilityKey && set[visibilityKey] === false) {
                return isEditMode ? `<div class="env-hidden" data-edit="${key}">${contentHtml}</div>` : '';
            }
            return isEditMode
                ? `<div class="env-editable" data-edit="${key}">
                     <span class="env-edit-pen" title="Edit this section"><i class="fa-solid fa-pen"></i></span>
                     ${contentHtml}
                   </div>`
                : contentHtml;
        };

        const bismillahText = escape(d?.content?.bismillah, 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ');
        const headingText = escape(d?.content?.heading, 'Royal Wedding Invitation');
        const groomName = escape(d?.couple?.groom, 'Groom Name');
        const brideName = escape(d?.couple?.bride, 'Bride Name');
        const groomPhoto = d?.couple?.groomPhoto;
        const bridePhoto = d?.couple?.bridePhoto;

        const invitationMsg = escape(d?.content?.message, 'With great pleasure, we request the honor of your presence at our celebration.');
        const eventTitle = escape(d?.mainEvent?.title, 'Nikah Ceremony');
        
        const dateParts = /^\d{4}-\d{2}-\d{2}$/.test(d?.mainEvent?.date || '') ? d.mainEvent.date.split('-').map(Number) : null;
        const selectedDate = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
        const eventDate = selectedDate ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate) : 'Wedding Date';

        const formatTime = (t) => window.formatTimeTo12Hour ? window.formatTimeTo12Hour(t) : t;
        const eventTime = formatTime(escape(d?.mainEvent?.time, '11:00 AM'));
        const endTime = d?.mainEvent?.endTime ? formatTime(escape(d.mainEvent.endTime)) : '';
        const displayTime = endTime ? `${eventTime} - ${endTime}` : eventTime;

        const eventVenue = escape(d?.mainEvent?.venue, 'Grand Imperial Banquet');
        const eventAddress = escape(d?.mainEvent?.address, 'Kochi, Kerala');
        const mapUrl = d?.mainEvent?.mapUrl;
        const isValidMapUrl = typeof mapUrl === 'string' && /^https?:\/\//i.test(mapUrl.trim());
        const safeMapUrl = isValidMapUrl ? escape(mapUrl.trim()) : '';

        // Open Envelope
        if (!window.toggleEnvelope) {
            window.toggleEnvelope = function(btn) {
                const root = btn.closest('.env-template-root');
                const wrapper = root ? root.querySelector('.env-envelope-wrapper') : null;
                if (wrapper) {
                    wrapper.classList.add('env-opened');
                }
            };
        }

        // Touch-swipe & navigation initialization
        if (!window.initEnvSwipe) {
            window.initEnvSwipe = function(el) {
                const track = el.querySelector('.env-slides-track');
                if (!track) return;
                let startX = 0, startY = 0, currentX = 0, isTouching = false, isSwiping = false;

                el.addEventListener('touchstart', (e) => {
                    if (e.touches.length > 1) return;
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    currentX = startX;
                    isTouching = true;
                    isSwiping = false;
                    track.style.transition = 'none';
                }, { passive: true });

                el.addEventListener('touchmove', (e) => {
                    if (!isTouching) return;
                    currentX = e.touches[0].clientX;
                    const diffX = currentX - startX;
                    const diffY = e.touches[0].clientY - startY;

                    if (!isSwiping && Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
                        isSwiping = true;
                    }

                    if (isSwiping) {
                        const activeIndex = Number(track.dataset.activeIndex || 0);
                        const slidesCount = track.querySelectorAll('.env-slide').length;
                        let resistedDiff = diffX;
                        if ((activeIndex === 0 && diffX > 0) || (activeIndex === slidesCount - 1 && diffX < 0)) {
                            resistedDiff = diffX * 0.35;
                        }
                        const baseOffset = -activeIndex * 100;
                        const containerWidth = el.offsetWidth || 360;
                        const percentDelta = (resistedDiff / containerWidth) * 100;
                        track.style.transform = `translateX(${baseOffset + percentDelta}%)`;
                    }
                }, { passive: true });

                el.addEventListener('touchend', () => {
                    if (!isTouching) return;
                    isTouching = false;
                    track.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';

                    if (isSwiping) {
                        const diffX = startX - currentX;
                        const slidesCount = track.querySelectorAll('.env-slide').length;
                        const activeIndex = Number(track.dataset.activeIndex || 0);
                        if (Math.abs(diffX) > 45) {
                            if (diffX > 0 && activeIndex < slidesCount - 1) {
                                window.changeEnvSlide(el, 1);
                            } else if (diffX < 0 && activeIndex > 0) {
                                window.changeEnvSlide(el, -1);
                            } else {
                                window.changeEnvSlide(el, 0);
                            }
                        } else {
                            window.changeEnvSlide(el, 0);
                        }
                    }
                }, { passive: true });
            };

            window.changeEnvSlide = function(btnOrContainer, direction) {
                const root = btnOrContainer.closest('.env-template-root');
                if (!root) return;
                const track = root.querySelector('.env-slides-track');
                const slides = root.querySelectorAll('.env-slide');
                if (!track || slides.length === 0) return;
                
                let activeIndex = Number(track.dataset.activeIndex || 0);
                let nextIndex = activeIndex + direction;
                nextIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
                
                track.dataset.activeIndex = nextIndex;
                track.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
                track.style.transform = `translateX(-${nextIndex * 100}%)`;
                
                const indicator = root.querySelector('.env-slide-indicator');
                if (indicator) indicator.innerText = `Slide ${nextIndex + 1} of ${slides.length}`;
            };
        }

        // Portraits layout
        let portraitsHtml = '';
        if (groomPhoto || bridePhoto) {
            portraitsHtml = `<div class="flex items-center justify-center gap-2 my-1 shrink-0">`;
            if (groomPhoto) {
                portraitsHtml += `<div class="relative w-12 h-12 rounded-full p-0.5 shrink-0 shadow-sm" style="border: 1.5px solid ${colors.primary};">
                                     <img src="${groomPhoto}" class="w-full h-full object-cover rounded-full aspect-square" />
                                 </div>`;
            }
            if (groomPhoto && bridePhoto) {
                portraitsHtml += `<span class="text-xs font-serif italic opacity-60" style="color: ${colors.primary};">&amp;</span>`;
            }
            if (bridePhoto) {
                portraitsHtml += `<div class="relative w-12 h-12 rounded-full p-0.5 shrink-0 shadow-sm" style="border: 1.5px solid ${colors.primary};">
                                     <img src="${bridePhoto}" class="w-full h-full object-cover rounded-full aspect-square" />
                                 </div>`;
            }
            portraitsHtml += `</div>`;
        }

        // Action buttons
        const mapBtnHtml = (set.showMap !== false && isValidMapUrl && !isEditMode) ? `
            <a href="${safeMapUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider no-underline transition active:scale-95 shadow-xs" style="background: ${colors.primary}; color: #ffffff;">
                <i class="fa-solid fa-location-dot"></i> Directions
            </a>
        ` : (isEditMode ? `<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider opacity-70 cursor-not-allowed shadow-xs" style="background: ${colors.primary}; color: #ffffff;"><i class="fa-solid fa-location-dot"></i> Directions</span>` : '');

        const reminderBtnHtml = isEditMode
            ? `<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider opacity-70 cursor-not-allowed border border-gray-200 bg-white text-gray-700 shadow-xs"><i class="fa-regular fa-bell"></i> Remind</span>`
            : `<button type="button" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider transition active:scale-95 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs" onclick="addWeddingReminder(this)" data-title="${escape(encodeURIComponent(`${eventTitle} — ${groomName} & ${brideName}`))}" data-location="${escape(encodeURIComponent(`${eventVenue}, ${eventAddress}`))}" data-date="${d?.mainEvent?.date || ''}" data-time="${escape(eventTime)}"><i class="fa-regular fa-bell text-rose-600"></i> Remind</button>`;

        // RSVP Block
        const rsvpHtml = (showRsvp && !isEditMode) ? `
            <div class="w-full max-w-[290px] text-center mx-auto shrink-0 space-y-2">
                <span class="text-[10px] uppercase font-bold tracking-widest block" style="color: ${colors.primary}">Kindly Respond</span>
                <h4 class="font-serif text-lg font-bold text-gray-900 leading-tight">Will You Attend?</h4>
                <p class="text-[11px] text-gray-500 mb-2">Please confirm your attendance so we may reserve your seats.</p>
                ${window.renderPublicRsvpForm ? window.renderPublicRsvpForm(colors, isEditMode, false) : ''}
            </div>
        ` : (isEditMode && showRsvp ? `
            <div class="w-full max-w-[280px] p-4 text-center border border-dashed rounded-2xl text-xs space-y-1 mx-auto" style="border-color: ${colors.primary}; background: rgba(255,255,255,0.6);">
                <i class="fa-solid fa-user-check text-xl mb-1 block" style="color: ${colors.primary}"></i>
                <div class="font-bold text-gray-800">RSVP Guest Form</div>
                <div class="text-[10px] text-gray-500">Guests will submit attendance on this slide.</div>
            </div>
        ` : '');

        let totalSlidesCount = 1;
        if (showRsvp) totalSlidesCount++;
        if (showPhotos) totalSlidesCount++;

        const styles = `
            <style>
                .env-template-root {
                    background-color: ${colors.bg};
                    color: #1F2937;
                    font-family: 'Poppins', sans-serif;
                    height: 100%;
                    min-height: 100dvh;
                    max-height: 100dvh;
                    width: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .env-envelope-wrapper {
                    position: absolute;
                    inset: 0;
                    z-index: 60;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.85s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.6s ease;
                    background: ${colors.bg};
                }
                .env-opened {
                    transform: translateY(102%) scale(0.96);
                    opacity: 0;
                    pointer-events: none;
                }

                .env-envelope-inner {
                    position: relative;
                    width: 86%;
                    max-width: 320px;
                    aspect-ratio: 4/3;
                    border: 2px solid ${colors.primary};
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    text-align: center;
                }

                .env-wax-seal {
                    position: absolute;
                    bottom: -25px;
                    cursor: pointer;
                    width: 54px;
                    height: 54px;
                    background: radial-gradient(circle, #f39c12 0%, ${colors.primary} 70%, #7B1113 100%);
                    border: 2.5px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 800;
                    color: #ffffff;
                    animation: envBounce 2s infinite ease-in-out;
                    z-index: 45;
                }
                @keyframes envBounce {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px) scale(1.04); }
                }

                .env-slides-viewport {
                    position: relative;
                    width: 100%;
                    flex-grow: 1;
                    height: calc(100dvh - 4.5rem);
                    overflow: hidden;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                }

                .env-slides-track {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    will-change: transform;
                    touch-action: pan-y;
                }

                .env-slide {
                    flex: 0 0 100%;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 8px 12px;
                    box-sizing: border-box;
                    overflow: hidden;
                }

                /* Subtle glassmorphism backdrop container */
                .env-slide-card {
                    background: rgba(255, 255, 255, 0.85);
                    -webkit-backdrop-filter: blur(16px);
                    backdrop-filter: blur(16px);
                    border: 1.5px solid rgba(255, 255, 255, 0.7);
                    border-radius: 26px;
                    padding: 16px 14px;
                    width: 100%;
                    max-width: 340px;
                    height: 100%;
                    max-height: 94%;
                    box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.6);
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: center;
                    overflow: hidden;
                    color: #1F2937 !important;
                }

                .env-slide-card p, .env-slide-card div:not(.env-arabic-text) {
                    color: #1F2937;
                }

                .env-arabic-text {
                    font-family: 'Amiri', serif;
                    line-height: 1.4;
                }

                .env-editable {
                    position: relative;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .env-editable:hover {
                    outline: 1.5px dashed ${colors.primary};
                    background: rgba(0, 0, 0, 0.02);
                }
                .env-edit-pen {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 20px;
                    height: 20px;
                    background: ${colors.primary};
                    color: #ffffff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    z-index: 50;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                .env-hidden {
                    opacity: 0.35;
                    filter: grayscale(80%);
                }

                .env-pager-panel {
                    height: 4rem;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                    box-sizing: border-box;
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    z-index: 40;
                }

                .env-pager-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.9);
                    color: #1F2937;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
                .env-pager-btn:active {
                    transform: scale(0.92);
                    background: #ffffff;
                }
            </style>
        `;

        return `
            ${styles}
            <div class="env-template-root bg-cover bg-center" style="${d?.design?.bgImage ? `background-image: url('${d.design.bgImage}');` : ''}">
                
                <!-- INTERACTIVE ENVELOPE COVER -->
                ${!isEditMode ? `
                <div class="env-envelope-wrapper">
                    <div class="env-envelope-inner">
                        <span class="text-[9px] uppercase tracking-[0.3em] font-bold opacity-75 mb-2 text-white">An Invitation For You</span>
                        <h2 class="font-serif text-xl sm:text-2xl font-bold tracking-wider text-white">${groomName} &amp; ${brideName}</h2>
                        <p class="text-[10px] font-sans opacity-70 mt-1 text-white">${eventDate}</p>
                        
                        <div class="env-wax-seal" onclick="window.toggleEnvelope(this)" title="Tap seal to open invitation">
                            <span>OPEN</span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- VIEWPORT CONTAINER -->
                <div class="env-slides-viewport" onload="window.initEnvSwipe(this)">
                    <div class="env-slides-track" data-active-index="0" style="transform: translateX(0%);">
                        
                        <!-- SLIDE 1: UNIFIED INVITATION CARD -->
                        <div class="env-slide">
                            <div class="env-slide-card">
                                
                                <!-- Top: Bismillah & Heading -->
                                <div class="w-full text-center shrink-0 space-y-0.5">
                                    ${edit('bismillah', `<div class="env-arabic-text text-base sm:text-lg" style="color: ${colors.primary}">${bismillahText}</div>`, 'showBismillah')}
                                    ${edit('heading', `<div class="text-[8.5px] tracking-[0.2em] font-bold uppercase text-gray-500">${headingText}</div>`, 'showHeading')}
                                </div>

                                <!-- Middle: Couple & Message -->
                                <div class="w-full text-center flex flex-col items-center justify-center my-auto py-1">
                                    ${edit('couple', `
                                        <div class="w-full flex flex-col items-center">
                                            <h2 class="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gray-900" style="color: ${colors.primary} !important;">${groomName}</h2>
                                            <span class="text-xs font-serif italic text-gray-400 my-0.5">&amp;</span>
                                            <h2 class="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gray-900" style="color: ${colors.primary} !important;">${brideName}</h2>
                                            ${portraitsHtml}
                                        </div>
                                    `, 'showCouple')}

                                    ${edit('message', `<p class="text-[9.5px] leading-relaxed italic text-gray-600 px-2 font-serif max-w-[270px] mt-1 line-clamp-3">"${invitationMsg}"</p>`, 'showMessage')}
                                </div>

                                <!-- Bottom: Ceremony & Actions -->
                                <div class="w-full text-center shrink-0 pt-1 border-t border-gray-100/80">
                                    ${edit('mainEvent', `
                                        <div class="w-full text-center flex flex-col items-center space-y-1">
                                            <h3 class="font-serif text-[11px] font-bold uppercase tracking-wider" style="color: ${colors.primary}">${eventTitle}</h3>
                                            
                                            <div class="flex items-center justify-center gap-3 text-[10px] text-gray-700 font-medium">
                                                <span><i class="fa-regular fa-calendar-check mr-1" style="color: ${colors.primary}"></i>${eventDate}</span>
                                                <span class="text-gray-300">•</span>
                                                <span><i class="fa-regular fa-clock mr-1" style="color: ${colors.primary}"></i>${displayTime}</span>
                                            </div>

                                            <div class="text-[9.5px] text-gray-500 leading-tight">
                                                <span class="font-semibold text-gray-800">${eventVenue}</span>
                                                ${eventAddress ? ` — <span>${eventAddress}</span>` : ''}
                                            </div>
                                            
                                            <div class="flex justify-center items-center gap-2 pt-1">
                                                ${mapBtnHtml}
                                                ${reminderBtnHtml}
                                            </div>
                                        </div>
                                    `, 'showEvent')}

                                    ${totalSlidesCount > 1 ? `
                                    <div class="text-[8.5px] font-medium text-gray-400 tracking-wider pt-2 flex items-center justify-center gap-1">
                                        <span>Swipe to respond</span>
                                        <i class="fa-solid fa-chevron-right text-[7px] animate-pulse"></i>
                                    </div>
                                    ` : ''}
                                </div>

                            </div>
                        </div>

                        <!-- SLIDE 2: RSVP (Only appears if showRsvp is toggled enabled) -->
                        ${showRsvp ? `
                        <div class="env-slide">
                            <div class="env-slide-card justify-center">
                                ${rsvpHtml}
                            </div>
                        </div>
                        ` : ''}

                        <!-- SLIDE 3 / FINAL SLIDE: GET PHOTOS -->
                        ${showPhotos ? `
                        <div class="env-slide">
                            <div class="env-slide-card justify-between text-center">
                                <div class="shrink-0 space-y-1">
                                    <span class="text-[10px] uppercase font-bold tracking-widest block" style="color: ${colors.primary}">Celebration Gallery</span>
                                    <h4 class="font-serif text-lg font-bold text-gray-900 leading-tight">Event Photos</h4>
                                    <p class="text-[10.5px] text-gray-500 leading-normal max-w-[260px] mx-auto">Scan the QR code below with your phone camera to view and upload photos.</p>
                                </div>

                                <div class="my-auto py-2">
                                    ${d?.photosQr ? `
                                    <div class="w-36 h-36 bg-white p-2.5 rounded-2xl border border-gray-200/80 shadow-md flex items-center justify-center mx-auto">
                                        <img src="${d.photosQr}" alt="Photos QR" class="w-full h-full object-contain rounded-xl">
                                    </div>
                                    ` : `
                                    <div class="w-36 h-36 rounded-2xl bg-amber-50/50 border border-dashed border-amber-300 flex flex-col items-center justify-center text-amber-700 p-3 mx-auto">
                                        <i class="fa-solid fa-qrcode text-3xl mb-1 opacity-70 animate-pulse"></i>
                                        <span class="text-[9.5px] font-semibold">QR Code Image</span>
                                    </div>
                                    `}
                                </div>

                                <div class="w-full shrink-0 pt-2">
                                    ${d?.photosLink ? `
                                    <a href="${escape(d.photosLink)}" target="_blank" rel="noopener noreferrer" class="w-full py-3 px-4 rounded-xl text-white font-bold text-[10px] uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 no-underline" style="background: ${colors.primary};">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Photo Gallery
                                    </a>
                                    ` : `
                                    <div class="text-[10px] text-gray-400 italic">Gallery link available upon upload</div>
                                    `}
                                </div>
                            </div>
                        </div>
                        ` : ''}

                    </div>
                </div>

                <!-- NAVIGATION PAGER BAR -->
                ${totalSlidesCount > 1 ? `
                <div class="env-pager-panel">
                    <button type="button" class="env-pager-btn" onclick="window.changeEnvSlide(this, -1)" title="Previous Slide">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    
                    <span class="text-[9px] font-bold text-white tracking-widest uppercase env-slide-indicator">Slide 1 of ${totalSlidesCount}</span>
                    
                    <button type="button" class="env-pager-btn" onclick="window.changeEnvSlide(this, 1)" title="Next Slide">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                ` : ''}

            </div>
            <script>
                (function() {
                    const root = document.querySelector('.env-template-root:last-of-type') || document.querySelector('.env-template-root');
                    if (root && window.initEnvSwipe) {
                        const vp = root.querySelector('.env-slides-viewport');
                        if (vp) window.initEnvSwipe(vp);
                    }
                })();
            </script>
        `;
    }
});
