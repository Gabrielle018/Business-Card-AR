document.addEventListener("DOMContentLoaded", () => {
    
    // --- VARIABLES ---
    const scannerView = document.getElementById('scanner-view');
    const homeView = document.getElementById('home-view');
    const profileView = document.getElementById('profile-view');
    const notifBar = document.getElementById('scan-notification');
    const linkText = document.getElementById('scanned-link');
    const btnOpen = document.getElementById('btn-open');
    const btnClose = document.getElementById('btn-close');

    // Nav
    const btnScan = document.getElementById('btn-scan');
    const btnHome = document.getElementById('btn-home');
    const btnProfile = document.getElementById('btn-profile');
    const debugBox = document.getElementById('debug-console');

    let html5QrCode; 
    let currentUrl = "";
    let scanCount = 0;
    let hasScanned = false;


    // --- DATA: EDIT YOUR INFO HERE ---
    const myProfileData = {
        name: "Jayniell Restie Manambit",
        role: "Software Developer",
        email: "student@college.edu",
        phone: "+63 912 345 6789",
        school: "San Beda University"
    };

    const myContacts = [
        { name: "Lugada, Yuan Gabriel D.", role: "Developer", date: "Now" },
        { name: "Abania, Jomuel C.", role: "Developer", date: "Today" },
        { name: "Moneva, Gabrielle B.", role: "Developer", date: "Today" }
    ];

    // --- DEBUG ---
    function log(msg) {
        // debugBox.style.display = 'block'; 
        debugBox.innerText = msg;
        console.log(msg);
    }

    // --- NAVIGATION LOGIC ---
    function switchView(viewName) {
        // 1. Hide everything first
        [homeView, profileView, scannerView].forEach(v => {
            v.classList.remove('active'); 
            v.classList.add('hidden');
        });
        notifBar.classList.add('hidden');

        // 2. Reset buttons
        btnHome.classList.remove('active');
        btnProfile.classList.remove('active');

        // 3. Show target view
        if (viewName === 'scanner') {
            scannerView.classList.remove('hidden'); 
            scannerView.classList.add('active');
            startCamera();
        } 
        else if (viewName === 'home') {
            homeView.classList.remove('hidden'); 
            homeView.classList.add('active');
            btnHome.classList.add('active');
            stopCamera();
            loadHome(); 
        } 
        else if (viewName === 'profile') {
            profileView.classList.remove('hidden'); 
            profileView.classList.add('active');
            btnProfile.classList.add('active');
            stopCamera();
            loadProfile(); 
        }
    }

    // --- DATA FUNCTIONS ---
    function loadHome() {
        const list = document.getElementById('contacts-list');
        list.innerHTML = ""; 
        myContacts.forEach(c => {
            const initials = c.name.slice(0, 2).toUpperCase();
            const html = `
                <div class="contact-card">
                    <div class="card-avatar">${initials}</div>
                    <div class="card-info"><h3>${c.name}</h3><p>${c.role} • ${c.date}</p></div>
                </div>`;
            list.innerHTML += html;
        });
    }

    

    function loadProfile() {
        document.getElementById('p-name').innerText = myProfileData.name;
        document.getElementById('p-role').innerText = myProfileData.role;
        document.getElementById('p-email').innerText = myProfileData.email;
        document.getElementById('p-phone').innerText = myProfileData.phone;
        document.getElementById('p-school').innerText = myProfileData.school;
        
        // Generate QR
        const qrData = `BEGIN:VCARD%0AVERSION:3.0%0AN:${myProfileData.name}%0ATEL:${myProfileData.phone}%0AEMAIL:${myProfileData.email}%0AEND:VCARD`;
        document.getElementById('qrcode-display').innerHTML = 
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}" style="width:100%; height:100%;" />`;
    }

  // --- TEMPORARY CONTACT ADD FUNCTION ---
    function addNewContact(name, role) {
        // Prevent duplicates
        const exists = myContacts.some(c => c.name === name && c.role === role);
        if (!exists) {
            myContacts.unshift({
                name: name,
                role: role,
                date: "Yesterday"
            });
        }

        // Update UI if Home view is active
        if (homeView.classList.contains("active")) {
            loadHome();
        }
    }

    // --- CAMERA LOGIC (LAPTOP OPTIMIZED) ---
    function startCamera() {
        log("Init Camera...");

        if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
        if(html5QrCode.isScanning) return;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // SETTINGS FOR LAPTOP SCANNING PHONE SCREENS:
        // 1. FPS 5: Slows it down so it doesn't blur
        // 2. BarCodeDetector = FALSE: Forces usage of the JS logic which is better at blurry images
        // 3. formatsToSupport: QR Code only (saves CPU)
        const config = { 
            fps: 5, 
            qrbox: isMobile ? { width: 250, height: 250 } : undefined, // Full screen for laptop
            experimentalFeatures: { useBarCodeDetectorIfSupported: false },
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
        };

        const cameraMode = isMobile ? "environment" : "user";

        html5QrCode.start(
            { facingMode: cameraMode }, 
            config, 
            onScanSuccess,
            onScanFailure
        ).catch(err => {
            log("Cam Error: " + err);
            // Fallback: Try generic start
            html5QrCode.start({}, config, onScanSuccess, onScanFailure);
        });
    }

    function stopCamera() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => html5QrCode.clear());
        }
    }

    

    function onScanSuccess(decodedText) {
    log("QR FOUND: " + decodedText);

    // --- RESTRICT TO 8TH WALL ONLY ---
    const is8thWall = (
        decodedText.startsWith("https://") &&
        (decodedText.includes("8thwall.com") || decodedText.includes("8thwall.app"))
    );

    if (!is8thWall) {
    log("❌ Not an 8th Wall QR");

    notifBar.classList.add("error");   // ADD THIS
    linkText.innerText = "Invalid QR: Only 8th Wall links are allowed.";

    notifBar.classList.remove('hidden');
    html5QrCode.pause();
    return;
}


    // --- IF VALID 8THWALL QR ---
    notifBar.classList.remove("error");
    html5QrCode.pause();

    currentUrl = decodedText;
    linkText.innerText = decodedText;
    notifBar.classList.remove('hidden');

   


}


    function onScanFailure(error) {
        // Just keeping the camera alive
        scanCount++;
        if(scanCount % 50 === 0) log("Scanning... " + scanCount);
    }

   // --- BUTTON ACTIONS ---
btnOpen.addEventListener('click', () => {
    if (currentUrl.startsWith("http")) {
        // Add contact TEMPORARILY when user clicks Open
        addNewContact("Liu, Bernie", "CEO");

        stopCamera();
        window.location.href = currentUrl;
    } else alert("Not a link: " + currentUrl);
});





    btnClose.addEventListener('click', () => {
        notifBar.classList.add('hidden');
        html5QrCode.resume();
    });

    btnScan.addEventListener('click', () => {
        if (scannerView.classList.contains('active')) switchView('home');
        else switchView('scanner');
    });
    btnHome.addEventListener('click', () => switchView('home'));
    btnProfile.addEventListener('click', () => switchView('profile'));

    // Start on Home
    switchView('home');
});