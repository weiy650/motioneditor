class Particle {
    constructor(x, y, char, ctx, spawnMode = 'normal') {
        this.ctx = ctx;
        this.char = char;
        
        this.originX = x; 
        this.originY = y;

        if (spawnMode === 'flying') {
            let angle = Math.random() * Math.PI * 2;
            let dist = Math.max(window.innerWidth, window.innerHeight);
            this.x = x + Math.cos(angle) * dist;
            this.y = y + Math.sin(angle) * dist;
        } else {
            this.x = x; 
            this.y = y;
        }
        
        this.size = 70; 
        this.weight = 400; 
        this.font = "Playfair Display";
        this.alpha = 1; 
        this.scaleX = 1; 
        this.scaleY = 1; 
        this.rotation = 0;
        this.color = { r: 255, g: 255, b: 255 };
        this.blur = 0; 
        this.furry = false;
        
        this.vx = 0; 
        this.vy = 0; 
        this.friction = 0.90; 
        this.spring = 0.1;    
        
        this.isClone = false; 
        this.life = 100; 
        this.mode = null; 
        this.denial = false; 
        this.isSelected = false;
        this.isFurry = false; 
        this.isSpiky = false; 
        this.spikyFactor = 0;
        this.driftX = 0; 
        this.driftY = 0;
    }

    update(mouseX, mouseY, motionGrid, width, height, isShiftHeld, currentMode, voiceStats, neighborLeft) {
        
        if (this.denial) return;

        if (this.isClone) {
            this.life -= 1.5; 
            this.alpha = this.life / 100;
            if (this.mode === 'weeping') this.y += 4;
            else if (this.mode === 'comma') this.y += 2;
            else if (this.mode === 'ellipsis') { 
                this.x += this.driftX; 
                this.y += this.driftY; 
                this.blur += 0.5; 
                this.scaleX *= 0.99; 
                this.scaleY *= 0.99;
            }
            return;
        }

        // WHISPER MODE (Ice Sliding)
        if (currentMode === 'whisper') {
            this.blur = 3; 
            this.alpha = 0.7;
            let dx_mouse = mouseX - this.x;
            let dy_mouse = mouseY - this.y;
            let dist_mouse = Math.sqrt(dx_mouse*dx_mouse + dy_mouse*dy_mouse);
            
            if (dist_mouse < 200) { 
                let force = (200 - dist_mouse) / 200;
                let jitterX = (Math.random() - 0.5) * 5;
                let jitterY = (Math.random() - 0.5) * 5;
                
                this.vx -= ((dx_mouse / dist_mouse) * 2 + jitterX * 0.1) * force * 5; 
                this.vy -= ((dy_mouse / dist_mouse) * 2 + jitterY * 0.1) * force * 5;
                
                this.rotation += (Math.random() - 0.5) * force * 10;
            }
            
            this.vx *= 0.92; 
            this.vy *= 0.92;
            this.x += this.vx; 
            this.y += this.vy;
            return; 
        }

        // AUDIO PHYSICS (Boosted)
        if (voiceStats.isLoud) {
            // Dough: Heavy, slow, wide
            this.weight = 800;
            this.scaleX += (1.5 - this.scaleX) * 0.1; // Make it WIDE
            this.scaleY += (0.8 - this.scaleY) * 0.1; // Squish it down
            this.friction = 0.8; // Stickier
        } else if (voiceStats.isFast) {
            // Jelly: Bouncy
            if (neighborLeft) {
                let dx = this.x - neighborLeft.x;
                let dist = Math.abs(dx);
                if (dist < 55) { 
                    this.vx += 2; // Stronger push
                    this.scaleX = 0.8; // Squeeze
                } else if (dist > 70) {
                    this.vx -= 1; 
                }
            }
            this.spring = 0.3; // Bouncier
        } else {
            // Reset to normal
            this.weight = 400;
            if(!this.isSpiky) {
                this.scaleX += (1 - this.scaleX) * 0.1;
                this.scaleY += (1 - this.scaleY) * 0.1;
            }
        }

        // MOTION CAPTURE (Fluid Grid)
        if (motionGrid && motionGrid.length > 0) {
            let gridX = Math.floor((this.x / width) * 40);
            let gridY = Math.floor((this.y / height) * 30);
            gridX = Math.max(0, Math.min(39, gridX));
            gridY = Math.max(0, Math.min(29, gridY));

            let cell = motionGrid[gridY][gridX];
            
            if (cell.active) {
                // Apply grid velocity directly to particle
                this.vx += cell.vx * 0.8; // Increased influence
                this.vy += cell.vy * 0.8;
                this.rotation += cell.vx * 0.2;
            }
        }

        // Standard Mouse Repel
        let dx_mouse = mouseX - this.x;
        let dy_mouse = mouseY - this.y;
        let dist_mouse = Math.sqrt(dx_mouse*dx_mouse + dy_mouse*dy_mouse);
        
        if (dist_mouse < 100 && !isShiftHeld) {
            let force = (100 - dist_mouse) / 100;
            this.vx -= (dx_mouse / dist_mouse) * force * 5;
            this.vy -= (dy_mouse / dist_mouse) * force * 5;
        }

        // Return Home
        let dx = this.originX - this.x;
        let dy = this.originY - this.y;
        
        this.vx += dx * this.spring;
        this.vy += dy * this.spring;
        
        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx;
        this.y += this.vy;

        if (isShiftHeld && dist_mouse < 50) this.isSelected = true;
    }

    draw() {
        if (this.alpha <= 0) return;
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotation * Math.PI / 180);
        this.ctx.scale(this.scaleX, this.scaleY);

        let r = this.isSelected ? 255 : this.color.r;
        let g = this.isSelected ? 215 : this.color.g;
        let b = this.isSelected ? 0 : this.color.b;

        if (this.blur > 0) this.ctx.filter = `blur(${this.blur}px)`;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
        this.ctx.font = `${this.weight} ${this.size}px "${this.font}"`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(this.char, 0, 0);

        this.ctx.restore();
    }
}

class App {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.input = document.getElementById('master-input');
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.particles = [];
        this.clones = [];
        this.text = " Motion Editor";
        this.mouse = { x: 0, y: 0 };
        this.bgBaseColor = { r: 20, g: 20, b: 20 };
        this.isShiftHeld = false;
        this.isComposing = false; 
        
        this.lastInputSource = 'keyboard'; 
        this.lastCharTime = 0;
        this.voiceStats = { isFast: false, isLoud: false, isSlow: false, vol: 0 };
        
        this.motionGrid = Array(30).fill().map(() => Array(40).fill({vx:0, vy:0, active:false}));
        this.webcamActive = false;
        this.video = document.getElementById('webcam-feed');
        this.motionCanvas = document.getElementById('motion-canvas');
        this.motionCtx = this.motionCanvas.getContext('2d', { willReadFrequently: true });
        this.prevFrame = null;

        this.initAudio();
        this.initRecorder();
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            document.getElementById('cursor-follower').style.left = e.clientX + 'px';
            document.getElementById('cursor-follower').style.top = e.clientY + 'px';
        });

        window.addEventListener('click', (e) => {
            const isControl = e.target.closest('button') || e.target.closest('.glass-dock');
            if (!isControl) {
                this.input.focus();
            }
        });

        this.input.addEventListener('compositionstart', () => this.isComposing = true);
        this.input.addEventListener('compositionend', (e) => {
            this.isComposing = false;
            this.handleInput(e.target.value, 'keyboard');
        });
        this.input.addEventListener('input', (e) => {
            if (!this.isComposing) this.handleInput(e.target.value, 'keyboard');
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.isShiftHeld = true;
                document.body.classList.add('selection-mode');
            }
            if (document.activeElement !== this.input && e.key.length === 1) {
                this.input.focus();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.isShiftHeld = false;
                document.body.classList.remove('selection-mode');
            }
        });

        const picker = document.getElementById('bg-picker');
        picker.addEventListener('input', (e) => {
            const hex = e.target.value;
            document.getElementById('color-preview').style.backgroundColor = hex;
            const r = parseInt(hex.substr(1,2), 16);
            const g = parseInt(hex.substr(3,2), 16);
            const b = parseInt(hex.substr(5,2), 16);
            this.bgBaseColor = { r, g, b };
        });

        this.input.focus();
        this.layoutText();
        this.animate();
    }

    handleInput(val, source = 'keyboard') {
        this.lastInputSource = source; 
        let now = Date.now();
        if (val.length > this.text.length) {
            let diff = now - this.lastCharTime;
            this.voiceStats.isFast = diff < 120; // Relaxed threshold
            this.voiceStats.isSlow = diff > 300;
        }
        this.lastCharTime = now;

        const punctuationRegex = /[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/;
        const hasPunctuation = punctuationRegex.test(val);
        const clean = val.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g, '');
        
        this.input.value = clean;
        
        if (this.text !== clean) {
            this.text = clean;
            this.layoutText();
        }

        if (hasPunctuation && source === 'keyboard') {
            this.triggerDenial();
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.layoutText();
    }

    layoutText() {
        let spawnMode = (this.lastInputSource === 'voice') ? 'flying' : 'normal';
        this.particles = [];
        this.ctx.font = '400 70px "Playfair Display"';
        let startX = (this.width - this.ctx.measureText(this.text).width) / 2;
        const centerY = this.height / 2;

        for (let char of this.text) {
            this.particles.push(new Particle(startX, centerY, char, this.ctx, spawnMode));
            startX += this.ctx.measureText(char).width;
        }
    }

    triggerDenial() {
        document.body.classList.remove('shake-screen');
        void document.body.offsetWidth;
        document.body.classList.add('shake-screen');
        
        this.particles.forEach(p => {
            gsap.killTweensOf(p);
            p.denial = true; 
            gsap.to(p, {
                x: p.originX + (Math.random() * 60 - 30),
                y: p.originY + (Math.random() * 60 - 30),
                duration: 0.1, yoyo: true, repeat: 3,
                onComplete: () => { p.denial = false; gsap.to(p, { x: p.originX, y: p.originY, duration: 0.4 }); }
            });
        });
    }

    resetAnimations() {
        this.mode = null;
        this.clones = [];
        document.querySelectorAll('.glass-btn').forEach(b => b.classList.remove('active'));
        if (this.modeInterval) clearInterval(this.modeInterval);
        
        this.particles.forEach(p => {
            gsap.killTweensOf(p);
            p.denial = false; p.isSelected = false;
            p.alpha = 1; p.scaleX = 1; p.scaleY = 1; p.rotation = 0; p.blur = 0; p.furry = false;
            p.weight = 400; p.color = {r:255,g:255,b:255};
            gsap.to(p, { x: p.originX, y: p.originY, duration: 0.8, ease: "power2.out" });
        });
    }

    setMode(mode) {
        this.mode = mode;
        this.clones = [];
        document.querySelectorAll('.glass-btn').forEach(b => b.classList.remove('active'));
        
        const btns = document.querySelectorAll('button');
        btns.forEach(b => {
             if(b.onclick && b.onclick.toString().includes(mode)) b.classList.add('active');
        });

        if (this.modeInterval) clearInterval(this.modeInterval);

        const hasSelection = this.particles.some(p => p.isSelected);
        const targets = hasSelection ? this.particles.filter(p => p.isSelected) : this.particles;

        targets.forEach(p => {
            gsap.killTweensOf(p);
            p.alpha = 1; p.scaleX = 1; p.scaleY = 1; p.rotation = 0; p.blur = 0; p.furry = false;
            p.x = p.originX; p.y = p.originY;
            p.isSelected = false; 
        });

        this.triggerAnimation(targets);
    }

    triggerAnimation(targets) {
        if (!this.mode) return;
        
        if (this.mode === 'ellipsis') {
            this.modeInterval = setInterval(() => { 
                targets.forEach(p => { 
                    let c = new Particle(p.x, p.y, p.char, this.ctx, 'normal'); 
                    c.isClone = true; c.mode = 'ellipsis'; c.alpha = 0.5; 
                    c.driftX = (Math.random() - 0.2) * 2; 
                    c.driftY = -Math.random() * 3; c.life = 150; 
                    this.clones.push(c); 
                }); 
            }, 120); 
        }
        else if (this.mode === 'question') { 
            targets.forEach((p, i) => {
                p.alpha = 0; p.x = this.width + 100;
                gsap.to(p, { alpha: 1, x: p.originX, duration: 0.6, ease: "power3.out", delay: i*0.04 });
                gsap.to(p, { originY: p.originY - 50, rotation: "random(-8, 8)", duration: 2.5, yoyo: true, repeat: -1, delay: 0.6 + i*0.1 });
            });
        }
        else if (this.mode === 'exclamation') {
            targets.forEach(p => {
                let angle = Math.random() * Math.PI * 2;
                gsap.fromTo(p, { scaleX: 1 }, { x: p.originX + Math.cos(angle)*200, y: p.originY + Math.sin(angle)*200, scaleX: 2, scaleY: 2, duration: 0.2, yoyo: true, repeat: 1 });
            });
        }
        else if (this.mode === 'period') {
            targets.forEach((p, i) => { p.y = -500; p.alpha = 0; gsap.to(p, { y: p.originY, alpha: 1, duration: 0.8, ease: "bounce.out", delay: i*0.05 }); });
        }
        else if (this.mode === 'comma') {
            this.modeInterval = setInterval(() => { targets.forEach(p => { let c = new Particle(p.x, p.y, p.char, this.ctx, 'normal'); c.isClone = true; c.mode = 'comma'; c.alpha = 0.4; this.clones.push(c); }); }, 150);
        }
        else if (this.mode === 'parentheses') {
            targets.forEach((p, i) => {
                let destX = p.originX; p.x = this.width/2; p.y = this.height/2; p.alpha = 0; 
                gsap.to(p, { keyframes: { "0%": { x: this.width/2, y: this.height/2, alpha: 0, scale: 0 }, "40%": { x: (this.width/2 + destX)/2, y: this.height/2 - 300, alpha: 1, scale: 1 }, "100%": { x: destX, y: p.originY, ease: "bounce.out" } }, duration: 3, delay: i * 0.05 });
            });
        }
        else if (this.mode === 'quotes') {
            targets.forEach(p => { gsap.to(p, { y: p.originY - 20, color: {r:255,g:100,b:100}, duration: 0.5 }); let c = new Particle(p.x, p.originY + 20, p.char, this.ctx, 'normal'); c.color = {r:100,g:255,b:255}; c.originY = p.originY + 20; this.particles.push(c); });
        }
        else if (this.mode === 'tilde') {
            targets.forEach((p, i) => { gsap.to(p, { scaleY: 1.8, scaleX: 0.7, y: p.originY + 30, duration: 1.5, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i*0.1 }); });
        }
        else if (this.mode === 'asterisk') {
            targets.forEach((p, i) => { gsap.to(p, { rotation: 360, duration: 1.5, repeat: -1, ease: "none" }); gsap.to(p, { alpha: 0.4, duration: 0.3, yoyo: true, repeat: -1 }); });
        }
        else if (this.mode === 'colon') {
            targets.forEach(p => { gsap.to(p, { scaleX: 1.2, scaleY: 1.2, duration: 0.3, yoyo: true, repeat: -1 }); });
        }
        else if (this.mode === 'semicolon') {
            targets.forEach((p, i) => { let dir = i % 2 === 0 ? -10 : 10; gsap.to(p, { y: p.originY + dir, duration: 1, yoyo: true, repeat: -1, ease: "sine.inOut" }); });
        }
        else if (this.mode === 'dash') {
            targets.forEach(p => { gsap.to(p, { scaleX: 3, letterSpacing: 20, duration: 1, yoyo: true, repeat: -1 }); });
        }
        else if (this.mode === 'slash') {
            targets.forEach((p, i) => { let offset = (i % 2 === 0) ? -20 : 20; gsap.to(p, { x: p.originX + offset, y: p.originY - offset, duration: 0.5 }); });
        }
        else if (this.mode === 'brackets') {
            targets.forEach(p => { gsap.to(p, { scaleX: 0.6, scaleY: 1.2, duration: 0.5, ease: "steps(2)" }); });
        }
        else if (this.mode === 'braces') {
            const mid = targets.length / 2; targets.forEach((p, i) => { let dir = i < mid ? 20 : -20; gsap.to(p, { x: p.originX + dir, rotation: dir, duration: 1 }); });
        }
        else if (this.mode === 'argument') {
            targets.forEach(p => { gsap.to(p, { x: "random(0, " + this.width + ")", y: "random(0, " + this.height + ")", scaleX: "random(0.5, 4)", scaleY: "random(0.5, 4)", rotation: "random(-90, 90)", color: {r:255,g:50,b:50}, duration: 0.1, repeat: 30, yoyo: true, onComplete: () => { gsap.to(p, {x: p.originX, y: p.originY, scaleX: 1, scaleY: 1, rotation: 0, color: {r:255,g:255,b:255}, duration: 0.5}); } }); });
        }
        else if (this.mode === 'weeping') {
            this.modeInterval = setInterval(() => { if(Math.random() > 0.5) { let src = targets[Math.floor(Math.random()*targets.length)]; let c = new Particle(src.x, src.y, src.char, this.ctx, 'normal'); c.isClone = true; c.mode = 'weeping'; c.alpha = 0.5; this.clones.push(c); } }, 50);
        }
        else if (this.mode === 'story') {
            targets.forEach((p, i) => { p.furry = true; p.weight = 600; gsap.to(p, { color: {r:255,g:245,b:210}, y: p.originY-20, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i*0.2 }); });
        }
        else if (this.mode === 'stutter') {
            targets.forEach((p, i) => {
                gsap.to(p, { x: () => p.originX + (Math.random() * 20 - 10), duration: 0.05, repeat: 20, yoyo: true, onComplete: () => { gsap.to(p, { x: p.originX, duration: 0.2 }); } });
                if (Math.random() > 0.5) { gsap.to(p, { alpha: 0, duration: 0.1, repeat: 5, yoyo: true }); }
            });
        }
    }

    async toggleWebcam() {
        if (!this.webcamActive) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
                this.video.srcObject = stream;
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    this.webcamActive = true;
                    document.getElementById('cam-status').style.opacity = 1;
                    this.analyzeMotionLoop(); // Start fallback/simple motion
                };
            } catch(e) { alert("Camera Error: " + e.message); }
        } else {
            this.webcamActive = false;
            document.getElementById('cam-status').style.opacity = 0;
            if(this.video.srcObject) this.video.srcObject.getTracks().forEach(t => t.stop());
        }
    }
    
    analyzeMotionLoop() {
        if (!this.webcamActive || this.video.paused) return;
        
        // PIXEL DIFFERENCE ENGINE (Reliable)
        this.motionCtx.drawImage(this.video, 0, 0, 320, 240);
        const frame = this.motionCtx.getImageData(0, 0, 320, 240).data;
        if (!this.prevFrame) { this.prevFrame = frame; requestAnimationFrame(() => this.analyzeMotionLoop()); return; }

        for (let y = 0; y < 30; y++) {
            for (let x = 0; x < 40; x++) {
                let idx = ((y*8+4) * 320 + (x*8+4)) * 4;
                let diff = (Math.abs(frame[idx] - this.prevFrame[idx]) + Math.abs(frame[idx+1] - this.prevFrame[idx+1]) + Math.abs(frame[idx+2] - this.prevFrame[idx+2])) / 3;
                
                let cell = this.motionGrid[y][x];
                
                if (diff > 25) { // Sensitivity
                    let vx = (Math.random() - 0.5) * 8; // Burst velocity
                    let vy = (Math.random() - 0.5) * 8;
                    this.motionGrid[y][x] = { vx: vx, vy: vy, active: true };
                } else {
                    this.motionGrid[y][x] = { vx: cell.vx * 0.9, vy: cell.vy * 0.9, active: Math.abs(cell.vx) > 0.1 };
                }
            }
        }
        this.prevFrame = frame;
        requestAnimationFrame(() => this.analyzeMotionLoop());
    }

    initAudio() {
        this.audioActive = false;
        this.audioContext = null;
        this.analyser = null;
        this.recognition = null;
    }
    
    async toggleMic() {
        if ('webkitSpeechRecognition' in window) {
            if (!this.recognition) {
                this.recognition = new webkitSpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.onresult = (event) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        transcript += event.results[i][0].transcript;
                    }
                    if (transcript.length > 0) this.handleInput(transcript, 'voice');
                };
            }
            if (!this.audioActive) this.recognition.start();
            else this.recognition.stop();
        }

        if (!this.audioActive) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                const source = this.audioContext.createMediaStreamSource(stream);
                source.connect(this.analyser);
                this.analyser.fftSize = 512;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                this.audioActive = true;
                document.getElementById('audio-status').style.opacity = 1;
                document.getElementById('mic-icon').classList.replace('ph-microphone', 'ph-microphone-slash');
            } catch(e) { alert("Mic Error: " + e.message); }
        } else {
            if(this.audioContext) this.audioContext.close();
            this.audioActive = false;
            document.getElementById('audio-status').style.opacity = 0;
            document.getElementById('mic-icon').classList.replace('ph-microphone-slash', 'ph-microphone');
        }
    }
    
    analyzeAudio() {
        if (!this.audioActive || !this.analyser) return;
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let sum = 0;
        for(let i=0; i<this.dataArray.length; i++) sum += this.dataArray[i];
        let avg = sum / this.dataArray.length;
        
        // BOOSTED SENSITIVITY for Visuals
        this.voiceStats.isLoud = avg > 30; // Lower threshold
        
        document.getElementById('bar-low').style.height = (avg * 0.5 + 4) + 'px';
        document.getElementById('bar-mid').style.height = (avg * 0.8 + 4) + 'px';
        document.getElementById('bar-high').style.height = (avg * 0.6 + 4) + 'px';
    }

    initRecorder() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
    }

    toggleRecord() {
         if (this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            document.getElementById('rec-dot').style.display = 'none';
        } else {
            const stream = this.canvas.captureStream(30);
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            this.recordedChunks = [];
            this.mediaRecorder.ondataavailable = e => this.recordedChunks.push(e.data);
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'empathic-type.webm'; a.click();
            };
            this.mediaRecorder.start();
            this.isRecording = true;
            document.getElementById('rec-dot').style.display = 'block';
        }
    }
    
    clear() {
        this.input.value = "";
        this.text = "";
        this.particles = [];
        this.clones = [];
        this.mode = null;
        document.querySelectorAll('.glass-btn').forEach(b => b.classList.remove('active'));
    }

    animate() {
        const r = this.bgBaseColor.r;
        const g = this.bgBaseColor.g;
        const b = this.bgBaseColor.b;
        
        const grad = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 0,
            this.width/2, this.height/2, Math.max(this.width, this.height)
        );
        grad.addColorStop(0, `rgb(${r+20}, ${g+20}, ${b+20})`);
        grad.addColorStop(1, "#000");

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.audioActive) this.analyzeAudio();

        this.particles.forEach((p, i) => {
            let left = i > 0 ? this.particles[i-1] : null;
            
            p.update(this.mouse.x, this.mouse.y, this.motionGrid, this.width, this.height, this.isShiftHeld, this.mode, this.voiceStats, left);
            p.draw();
        });

        for (let i = this.clones.length-1; i>=0; i--) {
            let p = this.clones[i];
            p.update(0,0, {}, this.width, this.height, false, this.mode, {}, {}, null);
            p.draw();
            if (p.life <= 0) this.clones.splice(i, 1);
        }

        requestAnimationFrame(() => this.animate());
    }
}

window.app = new App();