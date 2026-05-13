/**
 * Monthly Awards Certificate Generator - Corrected Version
 * MarketOne - Professional JavaScript with fixes for syntax, async handling, and robustness
 */

$(document).ready(function() {
    'use strict';
    
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    $('#awardMonth').val(currentMonth);

    // Award configuration with max winners per type
    const awardConfig = {
        'employee_quarter': { max: 1, title: 'Employee of the Quarter' },
        'employee_month': { max: 1, title: 'Employee of the Month' },
        'spot_award': { max: 3, title: 'Spot Award' },
        'value_award': { max: 1, title: 'Value Award' }
    };

    let selectedAwards = {};
    const navAwardMap = {
        0: 'employee_quarter',
        1: 'employee_month',
        2: 'spot_award',
        3: 'value_award'
    };

    // Navigation handler: scroll to sections and check awards
    $('.menu-section a').on('click', function(e) {
        e.preventDefault();
        const index = $(this).index();
        const awardType = navAwardMap[index];
        const checkbox = $(`.award-checkbox[value="${awardType}"]`);
        if (!checkbox.is(':checked')) {
            checkbox.prop('checked', true).trigger('change');
        }
        $('html, body').animate({
            scrollTop: $(`#section_${awardType}`).offset().top - 100
        }, 250);
    });

    // Month picker setup
    flatpickr("#awardMonth", {
        plugins: [new monthSelectPlugin({
            shorthand: false,
            dateFormat: "F Y",
            altFormat: "F Y"
        })],
        defaultDate: new Date(),
        theme: "material_blue"
    });

    let employees = []; // Global employee list

    // Load employee data asynchronously with error handling
    async function loadEmployees() {
        try {
            const response = await fetch('assets/data.json');
            if (!response.ok) throw new Error('Failed to load data');
            employees = await response.json();
        } catch (error) {
            console.error('Employee data load failed:', error);
            employees = []; // Fallback to empty array
        }
    }
    loadEmployees(); // Initiate load

    // Live search handler
    $(document).on('input', '.employee-search', function() {
        const input = $(this);
        const value = input.val().toLowerCase();
        const resultsBox = input.siblings('.employee-results');
        resultsBox.empty();

        if (value.length < 3 || employees.length === 0) {
            return; // Wait for min length and data load
        }

        const filtered = employees.filter(emp =>
            emp.name.toLowerCase().includes(value)
        ).slice(0, 5);

        filtered.forEach(emp => {
            resultsBox.append(`
                <div class="employee-item" data-name="${emp.name}" data-image="${emp.image}">
                    ${emp.name}
                </div>
            `);
        });
    });

    // Employee selection handler
    $(document).on('click', '.employee-item', function() {
        const name = $(this).data('name');
        const image = $(this).data('image');
        const container = $(this).closest('.award-entry');
        container.find('.employee-search').val(name);
        container.find('.employee-results').empty();
        container.find('.winner-photo-preview').attr('src', image).css('display', 'block');
        container.attr('data-employee-image', image);
    });

    // Award checkbox change handler
    $(document).on('change', '.award-checkbox', function() {
        const awardType = $(this).val();
        const isChecked = $(this).is(':checked');

        if (isChecked) {
            selectedAwards[awardType] = { counter: 0 };
            createAwardSection(awardType);
            $('html, body').animate({
                scrollTop: $(`#section_${awardType}`).offset().top - 100
            }, 250);
        } else {
            delete selectedAwards[awardType];
            $(`#section_${awardType}`).fadeOut(300, function() {
                $(this).remove();
            });
        }
        $('#submitContainer').toggle(Object.keys(selectedAwards).length > 0);
    });

    // Create new award section
    function createAwardSection(awardType) {
        const config = awardConfig[awardType];
        const showAddButton = awardType === 'spot_award';
        const sectionHtml = `
            <div class="form-section award-section" id="section_${awardType}" style="display: none;">
                <div class="award-section-header">
                    <h3 class="award-section-title">${config.title}</h3>
                    <span class="award-section-badge">Max ${config.max}</span>
                </div>
                <div id="entries_${awardType}"></div>
                ${showAddButton ? `<button type="button" class="btn-add-entry" data-award="${awardType}">+ Add Winner</button>` : ''}
            </div>
        `;
        $('#awardSections').append(sectionHtml);
        $(`#section_${awardType}`).fadeIn(400);
        addEntry(awardType);
    }

    // Add entry button
    $(document).on('click', '.btn-add-entry', function() {
        const awardType = $(this).data('award');
        const config = awardConfig[awardType];
        if (selectedAwards[awardType].counter >= config.max) {
            showAlert(`Maximum ${config.max} winners allowed for ${config.title}`, 'warning');
            return;
        }
        addEntry(awardType);
    });

    // Add single entry HTML
    function addEntry(awardType) {
        const counter = ++selectedAwards[awardType].counter;
        const entryHtml = `
            <div class="award-entry" id="entry_${awardType}_${counter}" style="display: none;" data-employee-image="">
                <h4 class="entry-header">Winner ${counter}</h4>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Winner Name <span class="required">*</span></label>
                        <input type="text" class="form-control custom-input winner-name employee-search" name="awards_${awardType}_${counter}_name" placeholder="Type at least 3 letters" autocomplete="off" required>
                        <div class="employee-results"></div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Employee Photo</label>
                        <div class="employee-photo-wrapper">
                            <img class="winner-photo-preview" id="preview_${awardType}_${counter}" style="display: none;">
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <label class="form-label">Achievement Description <span class="required">*</span></label>
                    <textarea class="custom-textarea winner-description" name="awards_${awardType}_${counter}_description" placeholder="Describe achievement..." required></textarea>
                    <button type="button" class="ai-btn generate-description-btn">Correct Grammar</button>
                </div>
                ${counter > 1 ? `<button type="button" class="btn-remove-entry" data-award="${awardType}" data-counter="${counter}">
                    <span>Remove Entry</span>
                </button>` : ''}
            </div>
        `;
        $(`#entries_${awardType}`).append(entryHtml);
        $(`#entry_${awardType}_${counter}`).fadeIn(400);
    }

    // Remove entry
    $(document).on('click', '.btn-remove-entry', function() {
        const awardType = $(this).data('award');
        const counter = $(this).data('counter');
        $(`#entry_${awardType}_${counter}`).fadeOut(300, function() {
            $(this).remove();
            selectedAwards[awardType].counter--;
            renumberEntries(awardType);
        });
    });

    // Renumber remaining entries
    function renumberEntries(awardType) {
        let counter = 1;
        $(`#entries_${awardType} .award-entry`).each(function() {
            $(this).find('.entry-header').text(`Winner ${counter}`);
            // Update name attributes for form submission
            $(this).find('.winner-name').attr('name', `awards_${awardType}_${counter}_name`);
            $(this).find('.winner-description').attr('name', `awards_${awardType}_${counter}_description`);
            counter++;
        });
    }

    // Grammar correction handler - FIXED
    $(document).on('click', '.generate-description-btn', async function() {
        const btn = $(this);
        const container = btn.closest('.award-entry');
        const textarea = container.find('.winner-description');
        const originalText = textarea.val().trim();

        // Empty check
        if (!originalText) {
            showAlert('Please enter description first', 'warning');
            return;
        }

        // Button loading state
        btn.text('Correcting...').prop('disabled', true);

        try {
            // LanguageTool API call
            const response = await fetch('https://api.languagetool.org/v2/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `text=${encodeURIComponent(originalText)}&language=en-US`
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            let correctedText = originalText;

            // Custom grammar fixes
            correctedText = correctedText
                .replace(/\bdone\b/gi, 'did')
                .replace(/\bsupport client request\b/gi, 'supporting client requests')
                .replace(/\s+/g, ' ')
                .trim();

            // Auto period
            if (!correctedText.endsWith('.')) {
                correctedText += '.';
            }

            // Apply LanguageTool fixes
            if (data.matches && data.matches.length > 0) {
                data.matches.reverse().forEach(match => {
                    if (match.replacements && match.replacements.length > 0) {
                        const replacement = match.replacements[0].value;
                        correctedText = correctedText.substring(0, match.offset) +
                                      replacement +
                                      correctedText.substring(match.offset + match.length);
                    }
                });
            }

            // Update textarea
            textarea.val(correctedText);
            showAlert('Grammar corrected successfully!', 'success');

        } catch (error) {
            console.error('Grammar correction failed:', error);
            showAlert('Grammar correction failed. Please try again.', 'error');
        }

        // Reset button
        btn.text('Correct Grammar').prop('disabled', false);
    });

    // Form validation and submission
    $('#awardForm').on('submit', function(e) {
        e.preventDefault();
        $('.error').removeClass('error');
        let isValid = true;

        // Check selected awards
        if (Object.keys(selectedAwards).length === 0) {
            showAlert('Please select at least one award type', 'error');
            isValid = false;
        }

        // Validate fields
        $('.winner-name, .winner-description').each(function() {
            const field = $(this);
            const value = field.val().trim();
            if (!value || value.length < 2) {
                field.addClass('error');
                isValid = false;
            }
        });

        if (!isValid) {
            showAlert('Please fill all required fields correctly', 'error');
            scrollToFirstError();
            return false;
        }

        generateCertificates();
    });

    // Utility: Show alert
    function showAlert(message, type = 'info') {
        const alertClass = type === 'error' ? 'danger' : type;
        const alertHtml = `
            <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        $('body').append(alertHtml);
        setTimeout(() => {
            $('.alert').fadeOut(400, function() { $(this).remove(); });
        }, 4000);
    }

    // Utility: Scroll to first error
    function scrollToFirstError() {
        const firstError = $('.error').first();
        if (firstError.length) {
            $('html, body').animate({
                scrollTop: firstError.offset().top - 100
            }, 500);
        }
    }

    // New certificate button
    $('#createNewBtn').on('click', function() {
        if (confirm('Are you sure you want to create a new certificate? Current progress will be lost.')) {
            location.reload();
        }
    });

    // Certificate generation - FIXED
    async function generateCertificates() {
        const dateValue = $('#awardMonth').val();
        const date = new Date(dateValue + '-01');
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();

        const awards = [];
        $('.award-entry').each(function() {
            const $this = $(this);
            const name = $this.find('.winner-name').val().trim();
            const description = $this.find('.winner-description').val().trim();
            const photo = $this.attr('data-employee-image');
            const awardType = $this.closest('.award-section').find('.award-section-title').text().trim();
            if (name && description && photo) {
                awards.push({ name, description, awardType, photo });
            }
        });

        if (awards.length === 0) {
            showAlert('No valid awards found. Please fill entries.', 'error');
            return;
        }

        // Wait for fonts to load
        await document.fonts.load('52px Bitter');
        
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 500 + (420 * Math.ceil(awards.length / 4));
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 52px Bitter, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Monthly Awards - ${month} ${year}`, 800, 120);

        // Footer message
        ctx.textAlign = 'center';
        ctx.fillStyle = '#222222';
        ctx.font = '22px Bitter, serif';
        wrapText(ctx, 'Congratulations to all the award winners! We appreciate your commitment to excellence and your willingness to consistently go beyond expectations. Your achievements set a remarkable standard for the entire team, and we look forward to seeing this positive momentum continue.', 800, canvas.height - 120, 1350, 42);

        // Subtext
        ctx.font = '28px Bitter, serif';
        ctx.fillStyle = '#444444';
        wrapText(ctx, 'Recognizing exemplary performance and commitment to organizational values.', 800, 200, 1200, 40);

        let currentY = 320;
        for (let i = 0; i < awards.length; i++) {
            const award = awards[i];
            const col = i % 4;
            const rowY = Math.floor(i / 4) * 420;
            const xPos = 100 + (col * 400);

            // Photo
            try {
                const photo = await loadUserPhoto(award.photo);
                drawRoundedImage(ctx, photo, xPos, currentY + rowY, 260, 260, 20);
            } catch (e) {
                console.warn('Photo load failed, using placeholder:', e);
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(xPos, currentY + rowY, 260, 260);
                ctx.fillStyle = '#999';
                ctx.font = '20px Bitter';
                ctx.textAlign = 'center';
                ctx.fillText('Photo', xPos + 130, currentY + rowY + 130);
            }

            // Name
            ctx.fillStyle = '#00A1D4';
            ctx.font = 'bold 32px Bitter, serif';
            ctx.textAlign = 'center';
            ctx.fillText(award.name, xPos + 130, currentY + rowY + 320);

            // Award type & description
            ctx.textAlign = 'left';
            ctx.fillStyle = '#111111';
            ctx.font = 'bold 30px Bitter, serif';
            ctx.fillText(award.awardType, xPos + 380, currentY + rowY + 40);

            ctx.fillStyle = '#555555';
            ctx.font = '24px Bitter, serif';
            wrapTextLeft(ctx, award.description, xPos + 380, currentY + rowY + 100, 900, 42);

            // Horizontal line
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(xPos, currentY + rowY + 380);
            ctx.lineTo(xPos + 1400, currentY + rowY + 380);
            ctx.stroke();
        }

        // Generate & display image
        const imageUrl = canvas.toDataURL('image/png');
        $('#generatedCertificate').attr('src', imageUrl).show();
        $('#downloadLink').attr('href', imageUrl).attr('download', `awards-${month}-${year}.png`);
        
        $('#certificateResult')
            .css({
                'margin-top': '100px',
                'padding': '40px',
                'background': '#f8f9fa',
                'border-radius': '10px',
                'z-index': '9999',
                'position': 'relative'
            })
            .show()
            .addClass('active');

        $('html, body').animate({
            scrollTop: $('#certificateResult').offset().top - 150
        }, 500);

        showAlert(`${awards.length} certificate(s) generated successfully! Scroll down to view.`, 'success');
    }

    // Utility functions
    function loadUserPhoto(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    function drawRoundedImage(ctx, img, x, y, width, height, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line.trim(), x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
    }

    function wrapTextLeft(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line.trim(), x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
    }

    // Navbar scroll effect
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 40) {
            $('.top-navbar').addClass('scrolled');
        } else {
            $('.top-navbar').removeClass('scrolled');
        }
    });
});