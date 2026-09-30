const luxurySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="100%" height="100%" fill="#0F172A"/>
    <rect x="20" y="20" width="360" height="260" rx="10" fill="none" stroke="#E2B13C" stroke-width="2" opacity="0.9"/>
    <text x="50%" y="130" dominant-baseline="middle" text-anchor="middle" font-family="'Cinzel', serif" font-weight="bold" font-size="28" letter-spacing="4" fill="#E2B13C">LUXURY</text>
    <text x="50%" y="170" dominant-baseline="middle" text-anchor="middle" font-family="'Playfair Display', serif" font-size="14" font-style="italic" fill="#FFFFFF">Royal Slides</text>
    <path d="M 180 220 L 200 200 L 220 220 Z" fill="#E2B13C"/>
</svg>`;
const luxuryThumb = 'data:image/svg+xml;base64,' + btoa(luxurySvg);

window.registerTemplate({
    id: 'bold-luxury-slides',
    name: 'Bold Royal Luxury Slides',
    thumb: luxuryThumb,
    freeform: false,
    scrollable: false, // Non-scrolling slides
    defaults: {
        colors: {
            primary: '#D97706',     // Warm Royal Gold/Amber
            bg: '#0F172A',          // Midnight Royal Navy
            text: '#1F2937'         // High contrast text on soft white backdrop
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
                return isEditMode ? `<div class="lx-hidden" data-edit="${key}">${contentHtml}</div>` : '';
            }
            return isEditMode
                ? `<div class="lx-editable" data-edit="${key}">
                     <span class="lx-edit-pen" title="Edit this section"><i class="fa-solid fa-pen"></i></span>
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
        
        const defaultInitials = `${groomName.charAt(0)}${brideName.charAt(0)}`.toUpperCase();
        const displayInitials = d?.couple?.customInitials ? escape(d.couple.customInitials) : defaultInitials;

        const invitationMsg = escape(d?.content?.message, 'With great joy, we invite you to honor us with your presence at our wedding.');
        const arabicQuote = escape(d?.content?.arabicText, 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا');
        const translationQuote = escape(d?.content?.translation, '"He has placed love and mercy between your hearts."');
        const eventTitle = escape(d?.mainEvent?.title, 'Nikah Ceremony');
        
        const dateParts = /^\d{4}-\d{2}-\d{2}$/.test(d?.mainEvent?.date || '') ? d.mainEvent.date.split('-').map(Number) : null;
        const selectedDate = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
        const eventDate = selectedDate ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate) : 'Wedding Date';

        const formatTime = (t) => window.formatTimeTo12Hour ? window.formatTimeTo12Hour(t) : t;
        const eventTime = formatTime(escape(d?.mainEvent?.time, '11:00 AM'));
        const endTime = d?.mainEvent?.endTime ? formatTime(escape(d.mainEvent.endTime)) : '';
        const displayTime = endTime ? `${eventTime} - ${endTime}` : eventTime;

        const eventVenue = escape(d?.mainEvent?.venue, 'Grand Royal Palace');
        const eventAddress = escape(d?.mainEvent?.address, 'Kochi, Kerala');
        const mapUrl = d?.mainEvent?.mapUrl;
        const isValidMapUrl = typeof mapUrl === 'string' && /^https?:\/\//i.test(mapUrl.trim());
        const safeMapUrl = isValidMapUrl ? escape(mapUrl.trim()) : '';

        // Touch-swipe & navigation initialization
        if (!window.initLxSwipe) {
            window.initLxSwipe = function(el) {
                const track = el.querySelector('.lx-slides-track');
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
                        const slidesCount = track.querySelectorAll('.lx-slide').length;
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
                        const slidesCount = track.querySelectorAll('.lx-slide').length;
                        const activeIndex = Number(track.dataset.activeIndex || 0);
                        if (Math.abs(diffX) > 45) {
                            if (diffX > 0 && activeIndex < slidesCount - 1) {
                                window.changeLxSlide(el, 1);
                            } else if (diffX < 0 && activeIndex > 0) {
                                window.changeLxSlide(el, -1);
                            } else {
                                window.changeLxSlide(el, 0);
                            }
                        } else {
                            window.changeLxSlide(el, 0);
                        }
                    }
                }, { passive: true });
            };

            window.changeLxSlide = function(btnOrContainer, direction) {
                const root = btnOrContainer.closest('.lx-template-root');
                if (!root) return;
                const track = root.querySelector('.lx-slides-track');
                const slides = root.querySelectorAll('.lx-slide');
                if (!track || slides.length === 0) return;
                
                let activeIndex = Number(track.dataset.activeIndex || 0);
                let nextIndex = activeIndex + direction;
                nextIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
                
                track.dataset.activeIndex = nextIndex;
                track.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
                track.style.transform = `translateX(-${nextIndex * 100}%)`;
                
                const indicator = root.querySelector('.lx-slide-indicator');
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
            <a href="${safeMapUrl}" target="_blank" rel="noopener noreferrer" class="lx-action-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider no-underline transition active:scale-95 shadow-xs" style="background: ${colors.primary}; color: #ffffff;">
                <i class="fa-solid fa-location-dot"></i> Directions
            </a>
        ` : (isEditMode ? `<span class="lx-action-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider opacity-70 cursor-not-allowed shadow-xs" style="background: ${colors.primary}; color: #ffffff;"><i class="fa-solid fa-location-dot"></i> Directions</span>` : '');

        const reminderBtnHtml = isEditMode
            ? `<span class="lx-action-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider opacity-70 cursor-not-allowed border border-gray-200 bg-white text-gray-700 shadow-xs"><i class="fa-regular fa-bell"></i> Remind</span>`
            : `<button type="button" class="lx-action-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider transition active:scale-95 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs" onclick="addWeddingReminder(this)" data-title="${escape(encodeURIComponent(`${eventTitle} — ${groomName} & ${brideName}`))}" data-location="${escape(encodeURIComponent(`${eventVenue}, ${eventAddress}`))}" data-date="${d?.mainEvent?.date || ''}" data-time="${escape(eventTime)}"><i class="fa-regular fa-bell text-amber-600"></i> Remind</button>`;

        // RSVP Block
        const rsvpHtml = (showRsvp && !isEditMode) ? `
            <div class="w-full max-w-[290px] text-center mx-auto shrink-0 space-y-2">
                <span class="text-[10px] uppercase font-bold tracking-widest block" style="color: ${colors.primary}">Kindly Respond</span>
                <h4 class="font-serif text-lg font-bold text-gray-900 leading-tight">Will You Attend?</h4>
                <p class="text-[11px] text-gray-500 mb-2">Please confirm your presence so we may prepare for your arrival.</p>
                ${window.renderPublicRsvpForm ? window.renderPublicRsvpForm(colors, isEditMode, false) : ''}
            </div>
        ` : (isEditMode && showRsvp ? `
            <div class="w-full max-w-[280px] p-4 text-center border border-dashed rounded-2xl text-xs space-y-1 mx-auto" style="border-color: ${colors.primary}; background: rgba(255,255,255,0.6);">
                <i class="fa-solid fa-user-check text-xl mb-1 block" style="color: ${colors.primary}"></i>
                <div class="font-bold text-gray-800">RSVP Guest Form</div>
                <div class="text-[10px] text-gray-500">Guests will submit attendance on this slide.</div>
            </div>
        ` : '');

        // Calculate total active slides
        let totalSlidesCount = 1;
        if (showRsvp) totalSlidesCount++;
        if (showPhotos) totalSlidesCount++;

        const styles = `
            <style>
                .lx-template-root {
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

                .lx-slides-viewport {
                    position: relative;
                    width: 100%;
                    flex-grow: 1;
                    height: calc(100dvh - 4.5rem);
                    overflow: hidden;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                }

                .lx-slides-track {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    will-change: transform;
                    touch-action: pan-y;
                }

                .lx-slide {
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
                .lx-slide-card {
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

                .lx-slide-card p, .lx-slide-card div:not(.lx-arabic-text) {
                    color: #1F2937;
                }

                .lx-arabic-text {
                    font-family: 'Amiri', serif;
                    line-height: 1.4;
                }

                /* Editable elements in studio */
                .lx-editable {
                    position: relative;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .lx-editable:hover {
                    outline: 1.5px dashed ${colors.primary};
                    background: rgba(0, 0, 0, 0.02);
                }
                .lx-edit-pen {
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
                .lx-hidden {
                    opacity: 0.35;
                    filter: grayscale(80%);
                }

                /* Bottom Navigation Bar */
                .lx-pager-panel {
                    height: 4rem;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                    box-sizing: border-box;
                    background: rgba(0, 0, 0, 0.25);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    z-index: 40;
                }

                .lx-pager-btn {
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
                .lx-pager-btn:active {
                    transform: scale(0.92);
                    background: #ffffff;
                }
            </style>
        `;

        return `
            ${styles}
            <div class="lx-template-root bg-cover bg-center" style="${d?.design?.bgImage ? `background-image: url('${d.design.bgImage}');` : ''}">
                
                <!-- VIEWPORT CONTAINER -->
                <div class="lx-slides-viewport" onload="window.initLxSwipe(this)">
                    <div class="lx-slides-track" data-active-index="0" style="transform: translateX(0%);">
                        
                        <!-- SLIDE 1: UNIFIED INVITATION CARD (Fills Viewport Without Overflow) -->
                        <div class="lx-slide">
                            <div class="lx-slide-card">
                                
                                <!-- Top: Bismillah & Heading -->
                                <div class="w-full text-center shrink-0 space-y-0.5">
                                    ${edit('bismillah', `<div class="lx-arabic-text text-base sm:text-lg" style="color: ${colors.primary}">${bismillahText}</div>`, 'showBismillah')}
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
                        <div class="lx-slide">
                            <div class="lx-slide-card justify-center">
                                ${rsvpHtml}
                            </div>
                        </div>
                        ` : ''}

                        <!-- SLIDE 3 / FINAL SLIDE: GET PHOTOS (Renders if showPhotos is enabled) -->
                        ${showPhotos ? `
                        <div class="lx-slide">
                            <div class="lx-slide-card justify-between text-center">
                                <div class="shrink-0 space-y-1">
                                    <span class="text-[10px] uppercase font-bold tracking-widest block" style="color: ${colors.primary}">Celebration Gallery</span>
                                    <h4 class="font-serif text-lg font-bold text-gray-900 leading-tight">Event Photos</h4>
                                    <p class="text-[10.5px] text-gray-500 leading-normal max-w-[260px] mx-auto">Scan the QR code below with your camera to view and upload celebration moments.</p>
                                </div>

                                <div class="my-auto py-2">
                                    ${d?.photosQr ? `
                                    <div class="w-36 h-36 bg-white p-2.5 rounded-2xl border border-gray-200/80 shadow-md flex items-center justify-center mx-auto">
                                        <img src="${d.photosQr}" alt="Photos QR" class="w-full h-full object-contain rounded-xl">
                                    </div>
                                    ` : `
                                    <div class="w-36 h-36 rounded-2xl bg-amber-50/50 border border-dashed border-amber-300 flex flex-col items-center justify-center text-amber-600 p-3 mx-auto">
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
                <div class="lx-pager-panel">
                    <button type="button" class="lx-pager-btn" onclick="window.changeLxSlide(this, -1)" title="Previous Slide">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    
                    <span class="text-[9px] font-bold text-white tracking-widest uppercase lx-slide-indicator">Slide 1 of ${totalSlidesCount}</span>
                    
                    <button type="button" class="lx-pager-btn" onclick="window.changeLxSlide(this, 1)" title="Next Slide">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                ` : ''}

            </div>
            <script>
                (function() {
                    const root = document.querySelector('.lx-template-root:last-of-type') || document.querySelector('.lx-template-root');
                    if (root && window.initLxSwipe) {
                        const vp = root.querySelector('.lx-slides-viewport');
                        if (vp) window.initLxSwipe(vp);
                    }
                })();
            </script>
        `;
    }
});
