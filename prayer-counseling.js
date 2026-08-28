/**
 * Christhood Ministries - Prayer Request & Counseling Gateway Engine
 */

(function () {
    const PRAYER_INTERCESSORY_PHONE = '254714545791';
    const COUNSELING_PASTORAL_PHONE = '254714545791';
    const MINISTRY_EMAIL = 'christhoodministries01@gmail.com';

    // Inject Modals into DOM if not present
    function injectGatewayModals() {
        if (document.getElementById('prayerModalOverlay')) return;

        const modalHtml = `
        <!-- Prayer Request Modal -->
        <div class="gateway-modal-overlay" id="prayerModalOverlay" aria-hidden="true" role="dialog" aria-modal="true">
            <div class="gateway-modal-container">
                <div class="gateway-modal-header">
                    <div class="gateway-modal-header-text">
                        <h3><i class='bx bx-pray'></i> Confidential Prayer Request</h3>
                        <p>Direct line to Sir Gee & the Christhood Intercessory Team</p>
                    </div>
                    <button type="button" class="gateway-modal-close" data-close="prayer" aria-label="Close modal">&times;</button>
                </div>
                <div class="gateway-modal-body">
                    <div class="gateway-privacy-notice">
                        <i class='bx bxs-shield-quarter'></i>
                        <span>Your request is held in utmost biblical confidentiality and prayed over by our consecrated intercessors.</span>
                    </div>

                    <form id="prayerRequestForm" onsubmit="return false;">
                        <div class="gateway-form-group">
                            <label for="prayerName">Your Name</label>
                            <input type="text" id="prayerName" class="gateway-form-control" placeholder="e.g. John Kamau">
                            <div class="gateway-checkbox-row">
                                <input type="checkbox" id="prayerAnonymous">
                                <label for="prayerAnonymous">Keep my request 100% anonymous</label>
                            </div>
                        </div>

                        <div class="gateway-form-group" id="prayerContactGroup">
                            <label for="prayerPhone">WhatsApp / Phone Number (Optional for follow-up)</label>
                            <input type="tel" id="prayerPhone" class="gateway-form-control" placeholder="+254 7XX XXX XXX">
                        </div>

                        <div class="gateway-form-group">
                            <label for="prayerCategory">Prayer Category</label>
                            <select id="prayerCategory" class="gateway-form-control">
                                <option value="Spiritual Breakthrough & Growth">Spiritual Breakthrough & Growth</option>
                                <option value="Healing, Health & Deliverance">Healing, Health & Deliverance</option>
                                <option value="Family, Marriage & Relationships">Family, Marriage & Relationships</option>
                                <option value="Career, Job & Financial Provision">Career, Job & Financial Provision</option>
                                <option value="Academic, School & Exams">Academic, School & Exams</option>
                                <option value="Grief, Comfort & Emotional Restoration">Grief, Comfort & Emotional Restoration</option>
                                <option value="Thanksgiving & Praise Report">Thanksgiving & Praise Report</option>
                                <option value="Other Prayer Need">Other Prayer Need</option>
                            </select>
                        </div>

                        <div class="gateway-form-group">
                            <label for="prayerPrivacy">Privacy Level</label>
                            <select id="prayerPrivacy" class="gateway-form-control">
                                <option value="Intercessory Lead (Sir Gee) & Pastoral Team Only">Confidential: Intercessory Lead (Sir Gee) Only</option>
                                <option value="General Intercessory Team Prayer Circle">Intercessory Circle: Full Prayer Team</option>
                                <option value="100% Anonymous Prayer">100% Anonymous: No Name Shared</option>
                            </select>
                        </div>

                        <div class="gateway-form-group">
                            <label for="prayerDetails">How can we pray with you? *</label>
                            <textarea id="prayerDetails" class="gateway-form-control" rows="4" placeholder="Share your prayer need, situation, or thanksgiving..." required></textarea>
                        </div>

                        <div class="gateway-submit-options">
                            <button type="button" class="gateway-submit-wa" id="sendPrayerWhatsApp">
                                <i class='bx bxl-whatsapp'></i> Send via WhatsApp
                            </button>
                            <button type="button" class="gateway-submit-email" id="sendPrayerEmail">
                                <i class='bx bx-envelope'></i> Send via Email
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Counseling Booking Modal -->
        <div class="gateway-modal-overlay" id="counselingModalOverlay" aria-hidden="true" role="dialog" aria-modal="true">
            <div class="gateway-modal-container">
                <div class="gateway-modal-header">
                    <div class="gateway-modal-header-text">
                        <h3><i class='bx bx-heart-circle'></i> Pastoral Counseling Intake</h3>
                        <p>Confidential Biblical guidance & spiritual support</p>
                    </div>
                    <button type="button" class="gateway-modal-close" data-close="counseling" aria-label="Close modal">&times;</button>
                </div>
                <div class="gateway-modal-body">
                    <div class="gateway-privacy-notice">
                        <i class='bx bxs-lock-alt'></i>
                        <span>All counseling sessions are strictly confidential, free of charge, and grounded in biblical grace and wisdom.</span>
                    </div>

                    <form id="counselingIntakeForm" onsubmit="return false;">
                        <div class="gateway-form-group">
                            <label for="counselingName">Full Name / Preferred Name *</label>
                            <input type="text" id="counselingName" class="gateway-form-control" placeholder="e.g. Grace Wanjiku" required>
                        </div>

                        <div class="gateway-form-group">
                            <label for="counselingPhone">WhatsApp / Phone Number *</label>
                            <input type="tel" id="counselingPhone" class="gateway-form-control" placeholder="+254 7XX XXX XXX" required>
                        </div>

                        <div class="gateway-form-group">
                            <label for="counselingEmail">Email Address (Optional)</label>
                            <input type="email" id="counselingEmail" class="gateway-form-control" placeholder="e.g. name@example.com">
                        </div>

                        <div class="gateway-form-group">
                            <label for="counselingTopic">Counseling Focus / Topic</label>
                            <select id="counselingTopic" class="gateway-form-control">
                                <option value="Grief & Loss Recovery">Grief & Loss Recovery</option>
                                <option value="Youth, Student & Career Mentorship">Youth, Student & Career Mentorship</option>
                                <option value="Marriage, Courtship & Premarital Guidance">Marriage, Courtship & Premarital Guidance</option>
                                <option value="Faith Doubts, Mind Renewal & Spiritual Growth">Faith Doubts, Mind Renewal & Spiritual Growth</option>
                                <option value="Emotional Healing, Anxiety & Depression">Emotional Healing, Anxiety & Depression</option>
                                <option value="Addiction Recovery & Personal Wholeness">Addiction Recovery & Personal Wholeness</option>
                                <option value="Family Reconciliation & Conflict Resolution">Family Reconciliation & Conflict Resolution</option>
                                <option value="Other Confidential Matter">Other Confidential Matter</option>
                            </select>
                        </div>

                        <div class="gateway-form-group">
                            <label for="counselingFormat">Preferred Session Format</label>
                            <select id="counselingFormat" class="gateway-form-control">
                                <option value="Confidential WhatsApp / Phone Call">Confidential WhatsApp / Phone Call</option>
                                <option value="Virtual Video Session (Google Meet)">Virtual Video Session (Google Meet)</option>
                                <option value="In-Person (Nairobi CBD Fellowship Hub)">In-Person (Nairobi CBD Fellowship Hub)</option>
                            </select>
                        </div>

                        <div class="gateway-form-group">
                            <label for="counselingTime">Preferred Days / Timing</label>
                            <select id="counselingTime" class="gateway-form-control">
                                <option value="Weekday Evenings (5:00 PM - 8:00 PM)">Weekday Evenings (5:00 PM - 8:00 PM)</option>
                                <option value="Saturday Afternoon (Post Fellowship)">Saturday Afternoon (Post Fellowship)</option>
                                <option value="Weekday Daytime">Weekday Daytime</option>
                                <option value="Flexible / Urgent">Flexible / Urgent</option>
                            </select>
                        </div>

                        <div class="gateway-form-group">
                            <label for="counselingNotes">Brief Context / What you would like to discuss (Optional)</label>
                            <textarea id="counselingNotes" class="gateway-form-control" rows="3" placeholder="Briefly describe what you are walking through..."></textarea>
                        </div>

                        <div class="gateway-submit-options">
                            <button type="button" class="gateway-submit-wa" id="sendCounselingWhatsApp">
                                <i class='bx bxl-whatsapp'></i> Book via WhatsApp
                            </button>
                            <button type="button" class="gateway-submit-email" id="sendCounselingEmail">
                                <i class='bx bx-envelope'></i> Book via Email
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Modal Control
    function openModal(modalId) {
        injectGatewayModals();
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    // Setup Event Listeners
    function setupGatewayListeners() {
        injectGatewayModals();

        // Open Triggers
        document.querySelectorAll('[data-open="prayer"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openModal('prayerModalOverlay');
            });
        });

        document.querySelectorAll('[data-open="counseling"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openModal('counselingModalOverlay');
            });
        });

        // Close buttons
        document.querySelectorAll('.gateway-modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-close');
                closeModal(target === 'prayer' ? 'prayerModalOverlay' : 'counselingModalOverlay');
            });
        });

        // Close on background overlay click
        document.querySelectorAll('.gateway-modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal(overlay.id);
                }
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal('prayerModalOverlay');
                closeModal('counselingModalOverlay');
            }
        });

        // Anonymous toggle
        const anonCheck = document.getElementById('prayerAnonymous');
        const nameInput = document.getElementById('prayerName');
        const contactGroup = document.getElementById('prayerContactGroup');

        if (anonCheck) {
            anonCheck.addEventListener('change', () => {
                if (anonCheck.checked) {
                    if (nameInput) {
                        nameInput.value = 'Anonymous Member';
                        nameInput.disabled = true;
                    }
                    if (contactGroup) contactGroup.style.display = 'none';
                } else {
                    if (nameInput) {
                        nameInput.value = '';
                        nameInput.disabled = false;
                    }
                    if (contactGroup) contactGroup.style.display = 'block';
                }
            });
        }

        // WhatsApp Prayer Submission
        const sendPrayerWABtn = document.getElementById('sendPrayerWhatsApp');
        if (sendPrayerWABtn) {
            sendPrayerWABtn.addEventListener('click', () => {
                const isAnon = document.getElementById('prayerAnonymous')?.checked;
                const name = isAnon ? 'Anonymous Member' : (document.getElementById('prayerName')?.value.trim() || 'A Brother/Sister in Christ');
                const phone = document.getElementById('prayerPhone')?.value.trim() || 'Not provided';
                const category = document.getElementById('prayerCategory')?.value || 'General Prayer';
                const privacy = document.getElementById('prayerPrivacy')?.value || 'Confidential';
                const details = document.getElementById('prayerDetails')?.value.trim();

                if (!details) {
                    alert('Please enter your prayer request details.');
                    document.getElementById('prayerDetails')?.focus();
                    return;
                }

                const msg = `Hello, I am contacting Christhood Ministries to submit a confidential Prayer Request.\n\n` +
                    `*From:* ${name}\n` +
                    (isAnon ? `*Privacy:* 100% Anonymous\n` : `*Phone:* ${phone}\n*Privacy Level:* ${privacy}\n`) +
                    `*Category:* ${category}\n\n` +
                    `*Prayer Need:*\n${details}\n\n` +
                    `_Submitted via Christhood Website Gateway_`;

                const waUrl = `https://wa.me/${PRAYER_INTERCESSORY_PHONE}?text=${encodeURIComponent(msg)}`;
                window.open(waUrl, '_blank');
                closeModal('prayerModalOverlay');
            });
        }

        // Email Prayer Submission
        const sendPrayerEmailBtn = document.getElementById('sendPrayerEmail');
        if (sendPrayerEmailBtn) {
            sendPrayerEmailBtn.addEventListener('click', () => {
                const isAnon = document.getElementById('prayerAnonymous')?.checked;
                const name = isAnon ? 'Anonymous Member' : (document.getElementById('prayerName')?.value.trim() || 'A Brother/Sister in Christ');
                const category = document.getElementById('prayerCategory')?.value || 'General Prayer';
                const privacy = document.getElementById('prayerPrivacy')?.value || 'Confidential';
                const details = document.getElementById('prayerDetails')?.value.trim();

                if (!details) {
                    alert('Please enter your prayer request details.');
                    document.getElementById('prayerDetails')?.focus();
                    return;
                }

                const subject = `[Confidential Prayer Request] - ${category}`;
                const body = `Hello, I am contacting Christhood Ministries to submit a confidential Prayer Request.\n\n` +
                    `From: ${name}\n` +
                    `Privacy Level: ${privacy}\n` +
                    `Category: ${category}\n\n` +
                    `Prayer Need:\n${details}\n\n` +
                    `Submitted via Christhood Prayer Gateway`;

                const mailtoUrl = `mailto:${MINISTRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoUrl;
                closeModal('prayerModalOverlay');
            });
        }

        // WhatsApp Counseling Booking
        const sendCounselingWABtn = document.getElementById('sendCounselingWhatsApp');
        if (sendCounselingWABtn) {
            sendCounselingWABtn.addEventListener('click', () => {
                const name = document.getElementById('counselingName')?.value.trim();
                const phone = document.getElementById('counselingPhone')?.value.trim();
                const email = document.getElementById('counselingEmail')?.value.trim() || 'Not provided';
                const topic = document.getElementById('counselingTopic')?.value;
                const format = document.getElementById('counselingFormat')?.value;
                const time = document.getElementById('counselingTime')?.value;
                const notes = document.getElementById('counselingNotes')?.value.trim() || 'None provided';

                if (!name) {
                    alert('Please enter your name.');
                    document.getElementById('counselingName')?.focus();
                    return;
                }
                if (!phone) {
                    alert('Please enter your phone number.');
                    document.getElementById('counselingPhone')?.focus();
                    return;
                }

                const msg = `Hello, I am contacting Christhood Ministries to book a confidential Pastoral Counseling session.\n\n` +
                    `*Name:* ${name}\n` +
                    `*Phone:* ${phone}\n` +
                    `*Email:* ${email}\n` +
                    `*Focus Area:* ${topic}\n` +
                    `*Preferred Format:* ${format}\n` +
                    `*Preferred Timing:* ${time}\n\n` +
                    `*Brief Context:*\n${notes}\n\n` +
                    `_Submitted via Christhood Website Gateway_`;

                const waUrl = `https://wa.me/${COUNSELING_PASTORAL_PHONE}?text=${encodeURIComponent(msg)}`;
                window.open(waUrl, '_blank');
                closeModal('counselingModalOverlay');
            });
        }

        // Email Counseling Booking
        const sendCounselingEmailBtn = document.getElementById('sendCounselingEmail');
        if (sendCounselingEmailBtn) {
            sendCounselingEmailBtn.addEventListener('click', () => {
                const name = document.getElementById('counselingName')?.value.trim();
                const phone = document.getElementById('counselingPhone')?.value.trim();
                const email = document.getElementById('counselingEmail')?.value.trim() || 'Not provided';
                const topic = document.getElementById('counselingTopic')?.value;
                const format = document.getElementById('counselingFormat')?.value;
                const time = document.getElementById('counselingTime')?.value;
                const notes = document.getElementById('counselingNotes')?.value.trim() || 'None provided';

                if (!name || !phone) {
                    alert('Please provide your name and phone number.');
                    return;
                }

                const subject = `[Confidential Counseling Intake] - ${name} (${topic})`;
                const body = `CONFIDENTIAL PASTORAL COUNSELING INTAKE\n\n` +
                    `Name: ${name}\n` +
                    `Phone: ${phone}\n` +
                    `Email: ${email}\n` +
                    `Focus Area: ${topic}\n` +
                    `Preferred Format: ${format}\n` +
                    `Preferred Timing: ${time}\n\n` +
                    `Brief Context:\n${notes}\n\n` +
                    `Submitted via Christhood Counseling Gateway`;

                const mailtoUrl = `mailto:${MINISTRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoUrl;
                closeModal('counselingModalOverlay');
            });
        }
    }

    // Expose global methods
    window.ChristhoodGateway = {
        openPrayer: () => openModal('prayerModalOverlay'),
        openCounseling: () => openModal('counselingModalOverlay'),
        closePrayer: () => closeModal('prayerModalOverlay'),
        closeCounseling: () => closeModal('counselingModalOverlay')
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupGatewayListeners);
    } else {
        setupGatewayListeners();
    }
})();
