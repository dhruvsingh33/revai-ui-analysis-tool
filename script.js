const API_HOST = 'https://ai-website-design-checker-ui-ux-analysis-tool.p.rapidapi.com';

        // State management functions
        function saveStateToHash(state) {
            const base64State = btoa(encodeURIComponent(JSON.stringify(state)));
            window.location.hash = base64State;
        }

        function getStateFromHash() {
            try {
                const hash = window.location.hash.slice(1); // Remove the # symbol
                if (hash) {
                    return JSON.parse(decodeURIComponent(atob(hash)));
                }
            } catch (error) {
                console.error('Error parsing state from hash:', error);
            }
            return null;
        }

        function updateState(newData = {}) {
            const currentState = getStateFromHash() || {};
            const updatedState = { ...currentState, ...newData };
            saveStateToHash(updatedState);
        }

        // Function to restore state from URL
        function restoreState() {
            const state = getStateFromHash();
            if (state) {
                // Restore form values
                if (state.webPageUrl) {
                    document.getElementById('webPageUrl').value = state.webPageUrl;
                }
                if (state.imageUrl) {
                    document.getElementById('imageUrl').value = state.imageUrl;
                }
                if (state.device) {
                    document.getElementById('deviceType').value = state.device;
                }
                if (state.language) {
                    document.getElementById('language').value = state.language;
                }

                // Restore results if they exist
                if (state.analysisResults) {
                    showResults();
                    displayResults(state.analysisResults);
                }

                // If there's an image preview URL in the state, restore it
                if (state.imagePreviewUrl) {
                    document.getElementById('previewImg').src = state.imagePreviewUrl;
                    document.getElementById('uploadPlaceholder').classList.add('hidden');
                    document.getElementById('imagePreview').classList.remove('hidden');
                    document.getElementById('imagePreview').classList.add('flex');
                }
            }
        }

        // Function to handle hash changes
        window.addEventListener('hashchange', restoreState);

        // Add input event listeners
        function setupStateListeners() {
            const inputs = ['webPageUrl', 'imageUrl', 'deviceType', 'language'];
            inputs.forEach(id => {
                document.getElementById(id).addEventListener('input', function() {
                    updateState({
                        [id]: this.value
                    });
                });
            });
        }

        // Function to handle image preview
        function handleImagePreview(input) {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imagePreviewUrl = e.target.result;
                    document.getElementById('previewImg').src = imagePreviewUrl;
                    document.getElementById('uploadPlaceholder').classList.add('hidden');
                    document.getElementById('imagePreview').classList.remove('hidden');
                    document.getElementById('imagePreview').classList.add('flex');
                    // Save preview URL to state
                    updateState({ imagePreviewUrl });
                }
                reader.readAsDataURL(file);
            }
        }

        // Function to remove image
        function removeImage() {
            document.getElementById('imageUpload').value = '';
            document.getElementById('previewImg').src = '';
            document.getElementById('uploadPlaceholder').classList.remove('hidden');
            document.getElementById('imagePreview').classList.add('hidden');
            document.getElementById('imagePreview').classList.remove('flex');
            // Remove image preview from state
            const currentState = getStateFromHash() || {};
            delete currentState.imagePreviewUrl;
            saveStateToHash(currentState);
        }

        // Initialize the page
        function initializePage() {
            // First restore state from hash if exists
            restoreState();
            // Then set user language if not already set in hash
            if (!window.location.hash) {
                setUserLanguage();
            }
            // Setup input listeners
            setupStateListeners();
        }

        // Call initialize when page loads
        document.addEventListener('DOMContentLoaded', initializePage);

        // Function to set user's language
        function setUserLanguage() {
            const languageSelect = document.getElementById('language');
            const userLanguages = navigator.languages || [navigator.language || navigator.userLanguage];
            
            // Get all available language codes from select options
            const availableLanguages = Array.from(languageSelect.options).map(option => option.value);
            
            // Try to find a matching language
            let matchedLang = null;
            for (let lang of userLanguages) {
                // Get the base language code (e.g., 'en' from 'en-US')
                const baseLang = lang.split('-')[0].toLowerCase();
                if (availableLanguages.includes(baseLang)) {
                    matchedLang = baseLang;
                    break;
                }
            }

            if (matchedLang) {
                // If we found a matching language, select it
                languageSelect.value = matchedLang;
            } else {
                // If no match found, add user's primary language as a new option
                const primaryLang = userLanguages[0].split('-')[0].toLowerCase();
                const option = document.createElement('option');
                option.value = primaryLang;
                option.textContent = `${primaryLang.toUpperCase()} (${primaryLang})`;
                languageSelect.add(option);
                languageSelect.value = primaryLang;
            }

            // Update state with initial language
            updateState({ language: languageSelect.value });
        }

        // Function to get common request parameters
        function getCommonParams() {
            return {
                language: document.getElementById('language').value,
                device: document.getElementById('deviceType').value
            };
        }

        // Function to analyze webpage URL
        async function analyzeWebPage() {
            const webPageUrl = document.getElementById('webPageUrl').value;

            if (!webPageUrl) {
                alert('Please enter the URL');
                return;
            }

            showResults();
            startSimulatedProgress(); // Start simulated progress
            
            try {
                console.log('Sending analyzeWebPage request to:', `${API_HOST}/analyze?noqueue=1`);
                const response = await fetch(`${API_HOST}/analyze?noqueue=1`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-rapidapi-host': 'ai-website-design-checker-ui-ux-analysis-tool.p.rapidapi.com',
                        'x-rapidapi-key': '816676629bmsh26a50cc438bca65p120383jsnbeac4f93906c'
                    },
                    body: JSON.stringify({
                        webPageUrl: webPageUrl,
                        ...getCommonParams()
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();
                console.log('analyzeWebPage API response:', data);
                stopSimulatedProgress(); // Stop simulated progress on success
                updateState({ analysisResults: data });
                displayResults(data);
            } catch (error) {
                console.error('Error in analyzeWebPage:', error);
                stopSimulatedProgress(); // Stop simulated progress on error
                handleError(error);
            }
        }

        // Function to analyze image URL
        async function analyzeImageUrl() {
            const imageUrl = document.getElementById('imageUrl').value;

            if (!imageUrl) {
                alert('Please enter the image URL');
                return;
            }

            showResults();
            startSimulatedProgress(); // Start simulated progress

            try {
                console.log('Sending analyzeImageUrl request to:', `${API_HOST}/analyze?noqueue=1`);
                const response = await fetch(`${API_HOST}/analyze?noqueue=1`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-rapidapi-host': 'ai-website-design-checker-ui-ux-analysis-tool.p.rapidapi.com',
                        'x-rapidapi-key': '816676629bmsh26a50cc438bca65p120383jsnbeac4f93906c'
                    },
                    body: JSON.stringify({
                        imageUrl: imageUrl,
                        ...getCommonParams()
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();
                console.log('analyzeImageUrl API response:', data);
                stopSimulatedProgress(); // Stop simulated progress on success
                updateState({ analysisResults: data });
                displayResults(data);
            } catch (error) {
                console.error('Error in analyzeImageUrl:', error);
                stopSimulatedProgress(); // Stop simulated progress on error
                handleError(error);
            }
        }

        // Function to handle image upload and analysis
        async function analyzeUploadedImage() {
            const fileInput = document.getElementById('imageUpload');

            if (!fileInput.files[0]) {
                alert('Please select an image');
                return;
            }

            showResults();
            startSimulatedProgress(); // Start simulated progress

            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            const { language, device } = getCommonParams();
            formData.append('language', language);
            formData.append('device', device);

            try {
                console.log('Sending analyzeUploadedImage request to:', `${API_HOST}/analyze?noqueue=1`);
                const response = await fetch(`${API_HOST}/analyze?noqueue=1`, {
                    method: 'POST',
                    headers: {
                        'x-rapidapi-host': 'ai-website-design-checker-ui-ux-analysis-tool.p.rapidapi.com',
                        'x-rapidapi-key': '816676629bmsh26a50cc438bca65p120383jsnbeac4f93906c'
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();
                console.log('analyzeUploadedImage API response:', data);
                stopSimulatedProgress(); // Stop simulated progress on success
                updateState({ analysisResults: data });
                displayResults(data);
            } catch (error) {
                console.error('Error in analyzeUploadedImage:', error);
                stopSimulatedProgress(); // Stop simulated progress on error
                handleError(error);
            }
        }

        // Function to show results section
        function showResults() {
            const resultsSection = document.getElementById('results');
            resultsSection.classList.remove('hidden');
            document.getElementById('loadingSpinner').classList.remove('hidden');
            document.getElementById('analysisResults').classList.add('hidden');
            document.getElementById('analysisStatus').textContent = 'Processing';
            document.getElementById('analysisStatus').classList.remove('bg-green-100', 'text-green-600', 'bg-red-100', 'text-red-600');
            document.getElementById('analysisStatus').classList.add('bg-blue-100', 'text-blue-600');

            // Smooth scroll to results section
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Function to display analysis results
        function displayResults(data) {
            if (!data || !data.result) {
                handleError(new Error('Invalid response data'));
                return;
            }

            const resultsContainer = document.getElementById('analysisResults');
            const statusElement = document.getElementById('analysisStatus');
            
            if (!resultsContainer || !statusElement) {
                console.error('Required DOM elements not found');
                return;
            }

            document.getElementById('loadingSpinner').classList.add('hidden');
            resultsContainer.classList.remove('hidden');

            // Clear previous analysis overlay
            const overlay = document.getElementById('analysisOverlay');
            overlay.innerHTML = '';

            // Get the image container section
            const imageSection = document.querySelector('#imageContainer').parentElement;

            // Check if there's image data
            if (data.image && data.image.base64) {
                // Show image section
                imageSection.classList.remove('hidden');
                
                const analyzedImage = document.getElementById('analyzedImage');
                const imageContainer = document.getElementById('imageContainer');
                const overlay = document.getElementById('analysisOverlay');
                
                // Set image source
                analyzedImage.src = data.image.base64;
                
                // Get dimensions from API response
                const originalWidth = data.imageStats?.dimensions?.width || 0;
                const originalHeight = data.imageStats?.dimensions?.height || 0;
                
                if (originalWidth && originalHeight) {
                    // Calculate maximum width while maintaining aspect ratio
                    const maxWidth = Math.min(800, originalWidth);
                    const scaleFactor = maxWidth / originalWidth;
                    const scaledHeight = originalHeight * scaleFactor;
                    
                    // Set container and image dimensions
                    imageContainer.style.maxWidth = `${maxWidth}px`;
                    imageContainer.style.margin = '0 auto';
                    analyzedImage.style.width = '100%';
                    analyzedImage.style.height = 'auto';
                    
                    // Function to update analysis boxes
                    function updateAnalysisBoxes() {
                        overlay.innerHTML = '';
                        
                        if (!data.result.analysis) return;
                        
                        // Get current image dimensions
                        const currentRect = analyzedImage.getBoundingClientRect();
                        const scaleX = currentRect.width / originalWidth;
                        const scaleY = currentRect.height / originalHeight;
                        
                        Object.entries(data.result.analysis).forEach(([category, details]) => {
                            if (details.elements) {
                                details.elements.forEach(element => {
                                    if (element.coords) {
                                        const box = document.createElement('div');
                                        box.className = 'absolute border-2 bg-blue-100 bg-opacity-20 group';
                                        
                                        // Set border color based on status
                                        const statusClass = element.status ? getStatusColor(element.status) : 'border-blue-500';
                                        box.className += ` border-${statusClass.split('-')[2]}`;
                                        
                                        // Ensure coordinates are within image bounds
                                        const x = Math.min(Math.max(0, element.coords.x), originalWidth);
                                        const y = Math.min(Math.max(0, element.coords.y), originalHeight);
                                        const width = Math.min(element.coords.width, originalWidth - x);
                                        const height = Math.min(element.coords.height, originalHeight - y);
                                        
                                        // Scale coordinates based on current image size
                                        const scaledX = x * scaleX;
                                        const scaledY = y * scaleY;
                                        const scaledWidth = width * scaleX;
                                        const scaledHeight = height * scaleY;
                                        
                                        // Position box
                                        box.style.left = `${scaledX}px`;
                                        box.style.top = `${scaledY}px`;
                                        box.style.width = `${scaledWidth}px`;
                                        box.style.height = `${scaledHeight}px`;
                                        
                                        // Create label container with improved positioning
                                        const labelContainer = document.createElement('div');
                                        labelContainer.className = 'absolute transform -translate-y-full -top-2 left-0 flex items-center gap-2 whitespace-nowrap z-10';
                                        
                                        // Add name label
                                        const nameLabel = document.createElement('div');
                                        nameLabel.className = `text-xs px-2 py-1 rounded-l ${statusClass}`;
                                        nameLabel.textContent = element.name;
                                        labelContainer.appendChild(nameLabel);
                                        
                                        // Add category badge
                                        const categoryBadge = document.createElement('div');
                                        categoryBadge.className = 'text-xs px-2 py-1 rounded-r bg-gray-100 text-gray-600';
                                        categoryBadge.textContent = category;
                                        labelContainer.appendChild(categoryBadge);
                                        
                                        box.appendChild(labelContainer);
                                        
                                        // Add hover info if there are issues
                                        if (element.issues && element.issues.length > 0) {
                                            const issuesContainer = document.createElement('div');
                                            issuesContainer.className = 'hidden group-hover:block absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded p-2 shadow-lg z-20 w-64';
                                            issuesContainer.innerHTML = element.issues.map(issue => `
                                                <div class="flex items-start gap-2 mb-2 last:mb-0">
                                                    <i class="fas fa-exclamation-circle text-yellow-500 mt-1"></i>
                                                    <span class="text-sm text-gray-600">${issue}</span>
                                                </div>
                                            `).join('');
                                            box.appendChild(issuesContainer);
                                        }
                                        
                                        overlay.appendChild(box);
                                    }
                                });
                            }
                        });
                    }
                    
                    // Initial update
                    updateAnalysisBoxes();
                    
                    // Update on resize
                    const resizeObserver = new ResizeObserver(() => {
                        requestAnimationFrame(updateAnalysisBoxes);
                    });
                    
                    resizeObserver.observe(analyzedImage);
                }
            } else {
                // Hide image section if no image data
                imageSection.classList.add('hidden');
            }

            if (data.status === 'success') {
                statusElement.textContent = 'Completed';
                statusElement.classList.remove('bg-blue-100', 'text-blue-600', 'bg-red-100', 'text-red-600');
                statusElement.classList.add('bg-green-100', 'text-green-600');

                const overallScoreElement = document.getElementById('overallScore');
                const summaryBriefElement = document.getElementById('summaryBrief');
                const keyIssuesList = document.getElementById('keyIssues');

                if (overallScoreElement && data.result.summary) {
                    overallScoreElement.textContent = `${data.result.summary.score}/10`;
                }
                
                if (summaryBriefElement && data.result.summary) {
                    summaryBriefElement.textContent = data.result.summary.brief;
                }
                
                // Display key issues with null check
                if (keyIssuesList && data.result.summary && data.result.summary.keyIssues) {
                    keyIssuesList.innerHTML = data.result.summary.keyIssues.map(issue => 
                        `<li class="flex items-start gap-2">
                            <i class="fas fa-exclamation-circle text-yellow-500 mt-1"></i>
                            <span>${issue}</span>
                        </li>`
                    ).join('');
                }

                // Display analysis categories
                const categoriesContainer = document.getElementById('analysisCategories');
                if (categoriesContainer && data.result.analysis) {
                    categoriesContainer.innerHTML = '';
                    
                    Object.entries(data.result.analysis).forEach(([category, details]) => {
                        // Convert snake_case to display text
                        const displayCategory = category.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');

                        const categoryHtml = `
                            <div class="border border-gray-200 rounded-lg p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex-1">
                                        <h3 class="text-lg font-semibold text-gray-800">${displayCategory}</h3>
                                        <span class="text-sm text-gray-500">Importance: ${details.importance}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-2xl font-bold ${getScoreColor(details.score)}">${details.score}/10</span>
                                    </div>
                                </div>
                                ${details.elements && details.elements.length > 0 ? `
                                    <div class="space-y-4 mb-4">
                                        ${details.elements.map(element => `
                                            <div class="bg-gray-50 rounded-lg p-4">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="font-medium text-gray-700">${element.name}</span>
                                                    <span class="px-2 py-1 rounded text-sm ${getStatusColor(element.status)}">${element.status}</span>
                                                </div>
                                                ${element.issues && element.issues.length > 0 ? `
                                                    <div class="space-y-1 mt-2">
                                                        ${element.issues.map(issue => `
                                                            <div class="flex items-start gap-2 text-sm">
                                                                <i class="fas fa-times-circle text-red-500 mt-1"></i>
                                                                <span class="text-gray-600">${issue}</span>
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                ` : ''}
                                                ${element.fixes && element.fixes.length > 0 ? `
                                                    <div class="space-y-1 mt-2">
                                                        ${element.fixes.map(fix => `
                                                            <div class="flex items-start gap-2 text-sm">
                                                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                                                <span class="text-gray-600">${fix}</span>
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                ${details.groupIssues && details.groupIssues.length > 0 ? `
                                    <div class="mt-4">
                                        <h4 class="text-sm font-semibold text-gray-700 mb-2">Group Issues</h4>
                                        <ul class="space-y-1">
                                            ${details.groupIssues.map(issue => `
                                                <li class="flex items-start gap-2 text-sm">
                                                    <i class="fas fa-exclamation-circle text-yellow-500 mt-1"></i>
                                                    <span class="text-gray-600">${issue}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                        categoriesContainer.innerHTML += categoryHtml;
                    });
                }

                // Display recommendations
                const recommendationsContainer = document.getElementById('recommendations');
                if (recommendationsContainer && data.result.recommendations) {
                    recommendationsContainer.innerHTML = data.result.recommendations.map(rec => `
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="px-2 py-1 rounded text-xs ${getPriorityColor(rec.priority)}">${rec.priority}</span>
                                <span class="text-sm font-medium text-gray-700">${rec.area}</span>
                            </div>
                            <p class="text-sm text-gray-600 mb-2">${rec.suggested}</p>
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-blue-600">Impact: ${rec.impact}</span>
                                <span class="text-gray-500">Effort: ${rec.effort}</span>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }

        // Function to handle errors
        function handleError(error) {
            console.error('Error:', error);
            const resultsSection = document.getElementById('results');
            const statusElement = document.getElementById('analysisStatus');
            if (resultsSection && statusElement) {
                resultsSection.classList.remove('hidden');
                statusElement.textContent = 'Error';
                statusElement.classList.remove('bg-green-100', 'text-green-600', 'bg-blue-100', 'text-blue-600');
                statusElement.classList.add('bg-red-100', 'text-red-600');
            }
        }

        // Function to get status color
        function getStatusColor(status) {
            switch (status) {
                case 'success':
                    return 'bg-green-100 text-green-600';
                case 'warning':
                    return 'bg-yellow-100 text-yellow-600';
                case 'error':
                    return 'bg-red-100 text-red-600';
                default:
                    return 'bg-blue-100 text-blue-600';
            }
        }

        // Function to get score color
        function getScoreColor(score) {
            if (score >= 7) return 'text-green-600';
            if (score >= 4) return 'text-yellow-600';
            return 'text-red-600';
        }

        // Function to get priority color
        function getPriorityColor(priority) {
            switch (priority) {
                case 'high':
                    return 'bg-red-100 text-red-600';
                case 'medium':
                    return 'bg-yellow-100 text-yellow-600';
                case 'low':
                    return 'bg-blue-100 text-blue-600';
                default:
                    return 'bg-gray-100 text-gray-600';
            }
        }

        // Theme toggle logic
        const themeToggle = document.getElementById('themeToggle');
        const htmlElement = document.documentElement;
        let vantaEffect; // Declare a variable to hold the Vanta.js effect instance
        let progressInterval;
        let currentProgress = 0;

        // Function to start simulated loading progress
        function startSimulatedProgress() {
            const loadingPercentageElement = document.getElementById('loadingPercentage');
            currentProgress = 0;
            loadingPercentageElement.textContent = '0%';

            progressInterval = setInterval(() => {
                currentProgress += Math.floor(Math.random() * 10) + 1; // Increment by a random amount
                if (currentProgress > 90) {
                    currentProgress = 90; // Cap at 90% to await actual results
                }
                loadingPercentageElement.textContent = `${currentProgress}%`;
            }, 500); // Update every 0.5 seconds
        }

        // Function to stop simulated loading progress
        function stopSimulatedProgress() {
            clearInterval(progressInterval);
            currentProgress = 100;
            document.getElementById('loadingPercentage').textContent = '100%';
        }

        // Function to initialize Vanta.js
        function initVanta(theme) {
            if (vantaEffect) {
                vantaEffect.destroy();
            }

            const vantaColor = theme === 'dark' ? 0x181822 : 0x6c6c98; // Dark theme color vs. light theme color

            vantaEffect = VANTA.WAVES({
                el: "body", // Attach to body
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: vantaColor
            });
        }

        // Set initial theme based on local storage or system preference
        function setInitialTheme() {
            const savedTheme = localStorage.getItem('theme');
            let currentTheme = 'light'; // Default to light

            if (savedTheme) {
                currentTheme = savedTheme;
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                currentTheme = 'dark';
            }
            
            htmlElement.setAttribute('data-theme', currentTheme);
            themeToggle.checked = (currentTheme === 'dark');
            setTimeout(() => {
                initVanta(currentTheme);
            }, 100); // Defer Vanta.js initialization slightly
        }

        // Toggle theme on button click
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                htmlElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                setTimeout(() => {
                    initVanta('dark');
                }, 100);
            } else {
                htmlElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                setTimeout(() => {
                    initVanta('light');
                }, 100);
            }
        });

        // Initialize theme when script loads
        document.addEventListener('DOMContentLoaded', () => {
            setInitialTheme();
        });