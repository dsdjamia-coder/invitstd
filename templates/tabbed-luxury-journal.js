const journalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="100%" height="100%" fill="#1B4332"/>
    <rect x="20" y="20" width="360" height="260" rx="15" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.8"/>
    <text x="50%" y="120" dominant-baseline="middle" text-anchor="middle" font-family="'Playfair Display', serif" font-size="28" font-weight="bold" fill="#D4AF37">JOURNAL</text>
    <text x="50%" y="160" dominant-baseline="middle" text-anchor="middle" font-family="'Playfair Display', serif" font-size="18" font-style="italic" fill="#FFFDF6">T a b b e d</text>
    <rect x="40" y="220" width="320" height="35" rx="10" fill="rgba(255,255,255,0.06)" stroke="#D4AF37" stroke-width="1" opacity="0.6"/>
    <circle cx="100" cy="237" r="4" fill="#D4AF37"/>
    <circle cx="200" cy="237" r="4" fill="#FFFDF6" opacity="0.6"/>
    <circle cx="300" cy="237" r="4" fill="#FFFDF6" opacity="0.6"/>
</svg>`;
const journalThumb = 'data:image/svg+xml;base64,' + btoa(journalSvg);

window.registerTemplate({
    id: 'tabbed-luxury-journal',
    name: 'Tabbed Luxury Journal',
    thumb: journalThumb,
    freeform: false,
    scrollable: false, // Non-scrolling interface
    defaults: {
        colors: {
            primary: '#D4AF37',     // Bright Gold
            bg: '#1B4332',          // Deep Emerald Green
            text: '#FFFDF6'         // Cream/Ivory
        },
        fonts: {
            heading: "'Playfair Display', serif"
        }
    },
    render: function(d, isEditMode) {
        const colors = {
            primary: d?.design?.colors?.primary || this.defaults.colors.primary,
            bg: d?.design?.colors?.bg || this.defaults.colors.bg,
            text: d?.design?.colors?.text || this.defaults.colors.text
        };
        const set = d?.settings || {};

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
                return isEditMode ? `<div class="jr-hidden" data-edit="${key}">${contentHtml}</div>` : '';
            }
            return isEditMode
                ? `<div class="jr-editable" data-edit="${key}">
                     <span class="jr-edit-pen" title="Edit this section"><i class="fa-solid fa-pen"></i></span>
                     ${contentHtml}
                   </div>`
                : contentHtml;
        };

        const bismillahText = escape(d?.content?.bismillah, 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ');
        const headingText = escape(d?.content?.heading, 'Save the Date');
        const groomName = escape(d?.couple?.groom, 'Groom Name');
        const brideName = escape(d?.couple?.bride, 'Bride Name');
        const groomPhoto = d?.couple?.groomPhoto;
        const bridePhoto = d?.couple?.bridePhoto;
        
        const defaultInitials = `${groomName.charAt(0)}${brideName.charAt(0)}`.toUpperCase();
        const displayInitials = d?.couple?.customInitials ? escape(d.couple.customInitials) : defaultInitials;

        const invitationMsg = escape(d?.content?.message, 'With immense pleasure, we invite you to share our joy as we unite in marriage.');
        const arabicQuote = escape(d?.content?.arabicText, 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا');
        const translationQuote = escape(d?.content?.translation, '"And among His signs is that He created for you mates that you may find peace in them."');
        const eventTitle = escape(d?.mainEvent?.title, 'Nikah Ceremony');
        
        const dateParts = /^\d{4}-\d{2}-\d{2}$/.test(d?.mainEvent?.date || '') ? d.mainEvent.date.split('-').map(Number) : null;
        const selectedDate = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
        const eventDate = selectedDate ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate) : 'Wedding Date';
        const monthLabel = selectedDate ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate) : 'Wedding Month';

        const formatTime = (t) => window.formatTimeTo12Hour ? window.formatTimeTo12Hour(t) : t;
        const eventTime = formatTime(escape(d?.mainEvent?.time, '11:00 AM'));
        const endTime = d?.mainEvent?.endTime ? formatTime(escape(d.mainEvent.endTime)) : '';
        const displayTime = endTime ? `${eventTime} - ${endTime}` : eventTime;

        const eventVenue = escape(d?.mainEvent?.venue, 'Grand Hall');
        const eventAddress = escape(d?.mainEvent?.address, 'City, Area');
        const mapUrl = d?.mainEvent?.mapUrl;
        const isValidMapUrl = typeof mapUrl === 'string' && /^https?:\/\//i.test(mapUrl.trim());
        const safeMapUrl = isValidMapUrl ? escape(mapUrl.trim()) : '';

        // Tab Switching logic (injected cleanly)
        if (!window.switchJournalTab) {
            window.switchJournalTab = function(btn, tabId) {
                const root = btn.closest('.jr-template-root');
                
                // Hide all tabs
                root.querySelectorAll('.jr-tab-content').forEach(tab => {
                    tab.classList.add('hidden');
                    tab.classList.remove('animate-fade-in');
                });
                
                // Show selected tab
                const targetTab = root.querySelector('#' + tabId);
                if (targetTab) {
                    targetTab.classList.remove('hidden');
                    targetTab.classList.add('animate-fade-in');
                }
                
                // Reset active tab buttons
                root.querySelectorAll('.jr-nav-btn').forEach(b => {
                    b.classList.remove('jr-nav-active');
                    b.style.color = '';
                });
                
                // Set active styling
                btn.classList.add('jr-nav-active');
                btn.style.color = colors.primary;
            };
        }

        // Generate Calendar View
        const calendar = (() => {
            if (!selectedDate) return '<div class="jr-calendar-empty text-xs opacity-50">Set date in Event Details</div>';
            const year = selectedDate.getFullYear(), month = selectedDate.getMonth(), selectedDay = selectedDate.getDate();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
            const cells = Array.from({ length: firstDay }, () => '<span></span>');
            for (let day = 1; day <= daysInMonth; day++) {
                cells.push(`<span class="${day === selectedDay ? 'jr-selected-day' : ''}">${day}${day === selectedDay ? '<b>♥</b>' : ''}</span>`);
            }
            return `<div class="jr-calendar-week">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => `<span>${day}</span>`).join('')}</div><div class="jr-calendar-grid">${cells.join('')}</div>`;
        })();

        // Portraits setup
        let portraitsHtml = '';
        if (groomPhoto || bridePhoto) {
            portraitsHtml = `<div class="flex items-center justify-center gap-3 my-1 w-full">`;
            if (groomPhoto) {
                portraitsHtml += `<div class="relative w-14 h-16 rounded-xl overflow-hidden shrink-0 border border-[#D4AF37]/50">
                                     <img src="${groomPhoto}" class="w-full h-full object-cover rounded-xl" />
                                 </div>`;
            }
            if (groomPhoto && bridePhoto) {
                portraitsHtml += `<span class="text-base font-serif italic opacity-60" style="color: ${colors.primary};">&amp;</span>`;
            }
            if (bridePhoto) {
                portraitsHtml += `<div class="relative w-14 h-16 rounded-xl overflow-hidden shrink-0 border border-[#D4AF37]/50">
                                     <img src="${bridePhoto}" class="w-full h-full object-cover rounded-xl" />
                                 </div>`;
            }
            portraitsHtml += `</div>`;
        }

        // Maps / Reminder buttons
        const mapBtnHtml = (set.showMap !== false && isValidMapUrl && !isEditMode) ? `
            <a href="${safeMapUrl}" target="_blank" rel="noopener noreferrer" class="jr-gold-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider no-underline transition active:scale-95">
                <i class="fa-solid fa-location-dot"></i> Maps
            </a>
        ` : (isEditMode ? `<span class="jr-gold-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider opacity-70 cursor-not-allowed"><i class="fa-solid fa-location-dot"></i> Map</span>` : '');

        const reminderBtnHtml = isEditMode
            ? `<span class="jr-gold-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider opacity-70 cursor-not-allowed"><i class="fa-regular fa-bell"></i> Remind</span>`
            : `<button type="button" class="jr-gold-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition active:scale-95" onclick="addWeddingReminder(this)" data-title="${escape(encodeURIComponent(`${eventTitle} — ${groomName} & ${brideName}`))}" data-location="${escape(encodeURIComponent(`${eventVenue}, ${eventAddress}`))}" data-date="${d?.mainEvent?.date || ''}" data-time="${escape(eventTime)}"><i class="fa-regular fa-bell"></i> Remind</button>`;

        // RSVP Setup
        const rsvpHtml = (set.showRsvp && !isEditMode) ? `
            <div class="w-full max-w-[280px] rounded-2xl p-4 text-center my-1 mx-auto" style="background: rgba(255,255,255,0.05); border: 1px solid ${colors.primary}20; color: ${colors.text};">
                <h4 class="text-xs font-bold mb-1.5" style="color: ${colors.primary}">Will You Attend?</h4>
                ${window.renderPublicRsvpForm ? window.renderPublicRsvpForm(colors, isEditMode, true) : ''}
            </div>
        ` : (isEditMode && set.showRsvp ? `<div class="w-full max-w-[280px] rounded-2xl p-4 text-center border border-dashed text-[10px] opacity-75" style="border-color: ${colors.primary}60; color: ${colors.text};">RSVP Form Area (Active)</div>` : '');

        const styles = `
            <style>
                .jr-template-root {
                    background-color: ${colors.bg};
                    color: ${colors.text};
                    font-family: 'Poppins', sans-serif;
                    height: 100%;
                    min-height: 520px;
                    width: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.45);
                    box-sizing: border-box;
                    padding: 16px 16px 70px;
                }

                .jr-tab-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    height: 100%;
                    width: 100%;
                    overflow-y: auto;
                    padding-bottom: 24px;
                }

                /* Tab navigation sticky footer */
                .jr-bottom-nav {
                    position: absolute;
                    bottom: 12px;
                    left: 12px;
                    right: 12px;
                    height: 54px;
                    background: rgba(0, 0, 0, 0.25);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    z-index: 35;
                }

                .jr-nav-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .jr-nav-btn i {
                    font-size: 14px;
                    margin-bottom: 3px;
                }
                .jr-nav-active {
                    color: ${colors.primary} !important;
                }

                /* Editable frames */
                .jr-editable {
                    position: relative;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .jr-editable:hover {
                    outline: 1.5px dashed #3B82F6;
                    background: rgba(59, 130, 246, 0.05);
                }
                .jr-edit-pen {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 20px;
                    height: 20px;
                    background: #2563EB;
                    color: #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    z-index: 50;
                }
                .jr-hidden {
                    opacity: 0.3;
                    filter: grayscale(80%);
                }

                /* Luxury style triggers */
                .jr-gold-btn {
                    background: linear-gradient(135deg, #FFEAA7 0%, ${colors.primary} 70%, #AA8022 100%);
                    color: ${colors.bg};
                    font-weight: 700;
                    box-shadow: 0 4px 8px rgba(212, 175, 55, 0.15);
                }

                /* Calendar grid */
                .jr-calendar-week { display: grid; grid-template-columns: repeat(7, 1fr); font-size: 8px; color: rgba(255,255,255,0.5); width: 100%; max-width: 200px; margin-bottom: 3px; }
                .jr-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px 2px; font-size: 10px; width: 100%; max-width: 200px; }
                .jr-calendar-grid span { position: relative; display: grid; place-items: center; min-height: 16px; }
                .jr-selected-day { background: rgba(212,175,55,0.25); border-radius: 50%; font-weight: 700; border: 1px solid ${colors.primary}; }
                .jr-selected-day b { display: none; }

                /* Animations */
                @keyframes jrFadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: jrFadeIn 0.3s forwards ease-out; }
            </style>
        `;

        return `
            ${styles}
            <div class="jr-template-root bg-cover bg-center bg-no-repeat flex flex-col items-center justify-between" style="${d?.design?.bgImage ? `background-image: url('${d.design.bgImage}');` : ''}">
                
                <!-- TAB 1: WELCOME (Active by Default) -->
                <div class="jr-tab-content space-y-4" id="jr-tab-welcome">
                    ${edit('bismillah', `<div class="font-arabic text-xl tracking-wide leading-loose" style="color: ${colors.primary}">${bismillahText}</div>`, 'showBismillah')}
                    
                    ${edit('couple', `
                        <div class="w-full flex flex-col items-center">
                            <div class="font-serif italic text-3xl font-bold tracking-wide" style="color: ${colors.primary}">${groomName}</div>
                            <span class="text-xs opacity-50 my-1 font-serif">&amp;</span>
                            <div class="font-serif italic text-3xl font-bold tracking-wide" style="color: ${colors.primary}">${brideName}</div>
                            ${portraitsHtml}
                        </div>
                    `, 'showCouple')}

                    ${edit('heading', `<div class="text-[10px] tracking-[0.25em] font-semibold opacity-90 uppercase" style="color: ${colors.primary}">${headingText}</div>`, 'showHeading')}
                    ${edit('message', `<div class="text-[11px] leading-relaxed italic opacity-85 px-4 max-w-[280px]">"${invitationMsg}"</div>`, 'showMessage')}
                </div>

                <!-- TAB 2: CEREMONY (Hidden) -->
                <div class="jr-tab-content hidden space-y-3" id="jr-tab-ceremony">
                    ${edit('mainEvent', `
                        <div class="w-full text-center flex flex-col items-center">
                            <div class="w-10 h-10 rounded-full border border-dashed flex items-center justify-center mb-2" style="border-color: ${colors.primary}; color: ${colors.primary}">
                                <i class="fa-solid fa-calendar-heart text-sm"></i>
                            </div>
                            <h3 class="font-serif text-sm font-bold uppercase tracking-wider mb-2" style="color: ${colors.primary}">${eventTitle}</h3>
                            
                            <div class="space-y-1 text-[11px] mb-3 opacity-90 leading-tight">
                                <p class="font-semibold"><i class="fa-regular fa-calendar mr-1.5" style="color: ${colors.primary}"></i>${eventDate}</p>
                                <p><i class="fa-regular fa-clock mr-1.5" style="color: ${colors.primary}"></i>${displayTime}</p>
                                <p class="font-medium mt-1"><i class="fa-solid fa-hotel mr-1.5" style="color: ${colors.primary}"></i>${eventVenue}</p>
                                <p class="text-[9px] opacity-70">${eventAddress}</p>
                            </div>

                            <div class="flex justify-center items-center gap-1.5 mt-2">
                                ${mapBtnHtml}
                                ${reminderBtnHtml}
                            </div>
                        </div>
                    `, 'showEvent')}

                    <!-- Hold the Date mini-calendar -->
                    ${edit('mainEvent', `
                        <div class="flex flex-col items-center scale-90 origin-top">
                            <span class="text-[8px] tracking-wider uppercase opacity-50 mb-1">Calendar Plan</span>
                            <div class="text-[10px] font-bold mb-1.5" style="color: ${colors.primary}">${monthLabel}</div>
                            ${calendar}
                        </div>
                    `, 'showEvent')}
                </div>

                <!-- TAB 3: VERSE / MONOGRAM (Hidden) -->
                <div class="jr-tab-content hidden space-y-4" id="jr-tab-verse">
                    ${edit('couple', `
                        <div class="w-14 h-14 mx-auto rounded-full border-2 border-dashed flex items-center justify-center font-serif text-lg font-bold" style="border-color: ${colors.primary}; color: ${colors.primary}">
                            ${displayInitials}
                        </div>
                    `, 'showCouple')}

                    ${edit('quran', `
                        <div class="px-4 py-3 rounded-2xl mx-2" style="background: rgba(255,255,255,0.04); border: 1px solid ${colors.primary}20;">
                            <div class="font-arabic text-base leading-loose" style="color: ${colors.primary}">${arabicQuote}</div>
                            <div class="text-[10px] opacity-75 mt-2 leading-relaxed italic">“${translationQuote}”</div>
                        </div>
                    `, 'showQuote')}
                </div>

                <!-- TAB 4: RSVP & TIME (Hidden) -->
                <div class="jr-tab-content hidden space-y-3" id="jr-tab-rsvp">
                    ${set.showCountdown ? edit('mainEvent', window.renderCountdownHtml ? window.renderCountdownHtml(d, colors, 'scale-85 origin-top mb-1') : '', 'showCountdown') : ''}
                    
                    ${rsvpHtml}
                </div>

                <!-- STICKY BOTTOM TAB NAVIGATION -->
                <div class="jr-bottom-nav">
                    <button type="button" class="jr-nav-btn jr-nav-active" onclick="switchJournalTab(this, 'jr-tab-welcome')" style="color: ${colors.primary}">
                        <i class="fa-solid fa-ring"></i>
                        Welcome
                    </button>
                    <button type="button" class="jr-nav-btn" onclick="switchJournalTab(this, 'jr-tab-ceremony')">
                        <i class="fa-solid fa-calendar-days"></i>
                        Ceremony
                    </button>
                    <button type="button" class="jr-nav-btn" onclick="switchJournalTab(this, 'jr-tab-verse')">
                        <i class="fa-solid fa-book-quran"></i>
                        Verse
                    </button>
                    <button type="button" class="jr-nav-btn" onclick="switchJournalTab(this, 'jr-tab-rsvp')">
                        <i class="fa-solid fa-user-check"></i>
                        RSVP
                    </button>
                </div>

            </div>
        `;
    }
});
