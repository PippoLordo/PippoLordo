// game.js - Versione migliorata con sistema di combattimento ottimizzato e finali personalizzati
class Game {
    constructor() {
        this.scenes = ['prologue','academy','market','forest','temple','betrayal','finalWar','epilogue'];
        this.currentSceneIndex = 0;
        this.combatActive = false;
        this.player = {
            name: '',
            class: '',
            gold: 50,
            magicPower: 1,
            reputation: 0,
            health: 100,
            maxHealth: 100,
            alignment: 'neutrale',
            inventory: [],
            choices: [] // Per tenere traccia delle scelte importanti
        };
       
        this.images = {
            backgrounds: {
                prologue: 'images/backgrounds/prologue_bg.png',
                academy: 'images/backgrounds/academy_bg.png',
                market: 'images/backgrounds/market_bg.png',
                forest: 'images/backgrounds/forest_bg.png',
                temple: 'images/backgrounds/temple_bg.png',
                battlefield: 'images/backgrounds/battlefield_bg.png'
            },
            characters: {
                knight: 'images/characters/main_knight.png',
                mage: 'images/characters/main_mage.png',
                darkMage: 'images/characters/main_dark_mage.png'
            },
            npcs: {
                dante: 'images/npcs/dante_ghost.png',
                eldred: 'images/npcs/eldred.png',
                merchant: 'images/npcs/thalendor_merchant.png',
                ecthelion: 'images/npcs/ecthelion_traitor.png',
                elf: 'images/npcs/forest_elf.png'
            },
            enemies: {
                iceGolem: 'images/enemies/ice_golem.png',
                darkMage: 'images/enemies/dark_mage.png',
                obscuria: 'images/enemies/obscuria_army.png'
            }
        };
        this.sounds = {
            sword: 'sounds/sword.ogg',
            magic: 'sounds/magic.ogg',
            combat: 'sounds/combat.ogg',
            bg: 'sounds/background.mp3',
            victory: 'sounds/victory.ogg',
            defeat: 'sounds/defeat.ogg'
        };
        this.combat = {
            enemyType: '',
            enemyHealth: 0,
            maxEnemyHealth: 0,
            turn: 'player',
            specialUsed: false,
            enemyAttackDelay: 3000 // Rallentiamo gli attacchi nemici (3 secondi)
        };
        this.init();
    }

    init() {
        this.preloadAssets();
        this.setupAudio();
        this.startScene(this.scenes[this.currentSceneIndex]);
    }

    preloadAssets() {
        // Preload immagini
        Object.values(this.images).forEach(cat => Object.values(cat).forEach(src => new Image().src = src));
        // Preload suoni
        Object.values(this.sounds).forEach(src => new Audio(src));
    }

    setupAudio() {
        this.audio = {
            bgMusic: document.getElementById('backgroundMusic'),
            play: (src) => { const s = new Audio(src); s.volume = 0.5; s.play(); }
        };
        document.addEventListener('click', () => this.audio.bgMusic.play(), { once: true });
    }

    startScene(scene) {
        this.combatActive = false;
        document.getElementById('combat-ui').classList.add('hidden');
        document.getElementById('background').src = this.images.backgrounds[scene] || this.images.backgrounds.prologue;
        
        // Pulisci i caratteri precedenti
        document.getElementById('characters').innerHTML = '';
        
        const method = 'render' + scene.charAt(0).toUpperCase() + scene.slice(1);
        if (this[method]) this[method]();
    }

    renderPrologue() {
        this.showMessage(
            `<h2>Prologo</h2>
             <img src="${this.images.npcs.dante}" style="max-height: 250px;">
             <p>Dante Alighieri: "Viandante, qual è il tuo nome?"</p>
             <input type="text" id="playerName" placeholder="Inserisci il tuo nome">`,
            [{ text: 'Inizia', action: () => {
                this.player.name = document.getElementById('playerName').value || 'Eroe';
                this.showClassSelection();
            }}]
        );
    }

    showClassSelection() {
        this.showMessage(
            `<h2>Scegli la tua classe</h2>
             <div style="display: flex; justify-content: space-around; text-align: center;">
               <div onclick="game.selectClass('knight')" style="cursor: pointer;">
                 <img src="${this.images.characters.knight}" style="max-height: 200px;"><p>Guerriero (+20💰)</p>
               </div>
               <div onclick="game.selectClass('mage')" style="cursor: pointer;">
                 <img src="${this.images.characters.mage}" style="max-height: 200px;"><p>Mago (+5✨)</p>
               </div>
               <div onclick="game.selectClass('darkMage')" style="cursor: pointer;">
                 <img src="${this.images.characters.darkMage}" style="max-height: 200px;"><p>Mago Oscuro (+3⭐)</p>
               </div>
             </div>`, []);
    }

    selectClass(cls) {
        this.player.class = cls;
        if (cls === 'knight') {
            this.player.gold += 20;
            this.player.maxHealth = 120; // Guerriero ha più salute
            this.player.health = 120;
            this.player.choices.push('warrior');
        }
        if (cls === 'mage') {
            this.player.magicPower += 5;
            this.player.choices.push('mage');
        }
        if (cls === 'darkMage') {
            this.player.reputation += 3;
            this.player.magicPower += 3;
            this.player.choices.push('darkMage');
        }
        this.updateStats();
        this.nextScene();
    }

    renderAcademy() {
        this.showScene('Accademia', this.images.npcs.eldred, 'Maestro Eldred: "Scegli la tua via..."', [
            { text: 'Studia guarigione (+20💰 +2✨)', action: () => {
                this.player.choices.push('healing');
                this.applyChoice({ gold:20, magic:2, rep:1, spell:'Healing' });
            }},
            { text: 'Apprendi protezione (+15💰 +3✨)', action: () => {
                this.player.choices.push('protection');
                this.applyChoice({ gold:15, magic:3, spell:'Protection' });
            }},
            { text: 'Magia oscura (+50💰 +5✨ -2⭐)', action: () => {
                this.player.choices.push('darkMagic');
                this.applyChoice({ gold:50, magic:5, rep:-2, spell:'Dark' });
            }}
        ]);
    }

    renderMarket() {
        this.showScene('Mercato Magico', this.images.npcs.merchant, 'Mercante: "Cosa desideri?"', [
            { text: 'Amuleto (50💰)', action: () => {
                this.player.choices.push('amulet');
                this.buyItem('amuleto',50,3);
            }},
            { text: 'Vendi segreti (+100💰 -3⭐)', action: () => {
                this.player.choices.push('sellSecrets');
                this.applyChoice({ gold:100, rep:-3 });
            }},
            { text: 'Bastone (75💰)', action: () => {
                this.player.choices.push('staff');
                this.buyItem('staff',75,2);
            }}
        ]);
    }

    renderForest() {
        this.showMessage(
            `<h2>Foresta Mistica</h2>
             <img src="${this.images.npcs.elf}" style="max-height: 250px;">
             <p>Elfo: "Cosa scioglie il ghiaccio del tradimento?"</p>
             <input type="text" id="riddleAnswer">`,
            [{ text: 'Rispondi', action: () => {
                const ans = document.getElementById('riddleAnswer').value.toLowerCase();
                if (ans === 'fedeltà') { 
                    this.player.magicPower += 5; 
                    this.player.choices.push('riddleCorrect');
                    this.showMessage('Esatto! +5✨', [{ text:'Continua', action:()=>this.nextScene() }]); 
                }
                else { 
                    this.player.reputation -= 3; 
                    this.player.choices.push('riddleWrong');
                    this.showMessage('Sbagliato! -3⭐', [{ text:'Continua', action:()=>this.nextScene() }]); 
                }
                this.updateStats();
            }}]
        );
    }

    renderTemple() {
        this.showScene('Tempio del Cristallo', this.images.npcs.ecthelion, 'Ecthelion: "Unisciti o sarai mio nemico!"', [
            { text: 'Smaschera Ecthelion (+3⭐)', action: () => {
                this.player.choices.push('unmaskEcthelion');
                this.applyChoice({ rep:3, loyal:true });
            }},
            { text: 'Alleanza Oscura (+200💰 -5⭐)', action: () => {
                this.player.choices.push('darkAlliance');
                this.applyChoice({ gold:200, rep:-5, loyal:false });
            }}
        ]);
    }

    renderBetrayal() {
        // Cambia il dialogo in base alle scelte precedenti
        let dialogText = `<h2>Tradimento!</h2>
                         <img src="${this.images.npcs.ecthelion}" class="shake" style="max-height: 250px;">`;
                         
        if (this.player.choices.includes('darkAlliance')) {
            dialogText += `<p>Ecthelion: "Credevi davvero che ti avrei permesso di condividere il mio potere? Sciocco!"</p>`;
        } else {
            dialogText += `<p>Ecthelion: "Sciocco! Ora scatenerò il vero potere!"</p>`;
        }
        
        this.showMessage(
            dialogText,
            [
                { text:'Affrontalo', action:() => {
                    this.showMessage(
                        `<h2>Ecthelion</h2>
                         <img src="${this.images.enemies.obscuria}" class="pulse" style="max-height: 300px;">
                         <p>"Ruggisci, Obscuria! Divora questo insetto!"</p>`,
                        [{ text:'Combatti!', action:() => this.startCombat('obscuria', 200) }]
                    );
                }},
                { text:'Fuggi', action:() => {
                    this.player.choices.push('fled');
                    this.showMessage('La tua ritirata permette al male di prosperare...', 
                        [{ text: 'Riprova', action: () => {
                            this.player.choices.pop(); // Rimuovi la scelta di fuga
                            this.renderBetrayal();
                        }}]);
                }}
            ]
        );
    }

    renderFinalWar() {
        let message = `<h2>La Guerra Finale</h2>`;
        
        if (this.player.reputation > 5) {
            message += `<p>Le forze del bene si radunano sotto il tuo comando. La tua reputazione di ${this.player.reputation} ha ispirato le nazioni.</p>`;
        } else if (this.player.reputation < -5) {
            message += `<p>Le forze dell'oscurità ti acclamano come loro nuovo leader. Il tuo allineamento ${this.player.alignment} ha corrotto le terre.</p>`;
        } else {
            message += `<p>Le forze del bene e del male si scontrano in un equilibrio precario. La tua posizione neutrale ha creato un mondo diviso.</p>`;
        }
        
        this.showMessage(
            message,
            [{ text: 'Continua verso l\'epilogo', action: () => this.nextScene() }]
        );
    }

    renderEpilogue() {
        let ending = '';
        let title = '';
        
        // Determina il finale in base alle scelte e alla reputazione
        if (this.player.choices.includes('darkAlliance') && this.player.reputation < -8) {
            title = "Sovrano dell'Oscurità";
            ending = `Dopo aver sconfitto Ecthelion, hai preso il suo posto come signore del male. La tua reputazione di ${this.player.reputation} ti ha reso il più temuto tiranno che il mondo abbia mai conosciuto.`;
        } else if (this.player.choices.includes('unmaskEcthelion') && this.player.reputation > 8) {
            title = "Campione della Luce";
            ending = `La tua vittoria su Ecthelion ha portato un'era di pace e prosperità. Con una reputazione di ${this.player.reputation}, sei diventato leggenda nelle canzoni dei bardi.`;
        } else if (this.player.gold > 300) {
            title = "Mercante Leggendario";
            ending = `Con ben ${this.player.gold} monete d'oro, hai abbandonato l'avventura per diventare il più ricco mercante dei regni. Il tuo impero commerciale si estende in tutte le terre.`;
        } else if (this.player.magicPower > 15) {
            title = "Arcimago Supremo";
            ending = `Il tuo potere magico di ${this.player.magicPower} ti ha elevato al rango di arcimago. Hai fondato una nuova accademia dove insegni le arti arcane alle future generazioni.`;
        } else {
            title = "Viaggiatore dei Mondi";
            ending = `Né eroe né villain, la tua storia continua oltre i confini conosciuti. Con ${this.player.gold} oro e ${this.player.magicPower} potere magico, cerchi nuove avventure in terre sconosciute.`;
        }
        
        // Aggiungi dettagli basati sulla classe
        let classDetail = '';
        if (this.player.class === 'knight') {
            classDetail = "La tua spada è ora conservata nel santuario degli eroi.";
        } else if (this.player.class === 'mage') {
            classDetail = "I tuoi incantesimi sono studiati in tutte le accademie magiche.";
        } else if (this.player.class === 'darkMage') {
            classDetail = "I tuoi rituali oscuri hanno cambiato per sempre la natura della magia.";
        }
        
        this.showMessage(
            `<h2>Epilogo: ${title}</h2>
             <img src="${this.images.characters[this.player.class]}" style="max-height: 250px;">
             <p>${ending}</p>
             <p>${classDetail}</p>
             <p>Le tue scelte hanno plasmato questo mondo in modi che continueranno a risuonare nei secoli a venire.</p>`,
            [{ text: 'Nuova Avventura', action: () => location.reload() }]
        );
    }

    startCombat(enemyType, maxHp) {
        this.combatActive = true;
        this.combat = {
            enemyType: enemyType,
            enemyHealth: maxHp,
            maxEnemyHealth: maxHp,
            turn: 'player',
            specialUsed: false,
            enemyAttackDelay: 3000 // 3 secondi di ritardo per attacchi nemici
        };
        
        document.getElementById('combat-ui').classList.remove('hidden');
        document.getElementById('background').src = this.images.backgrounds.battlefield;
        
        // Assicuriamoci che gli elementi esistano
        if (!document.getElementById('player-sprite')) {
            const charactersDiv = document.getElementById('characters');
            charactersDiv.innerHTML = `
                <img id="player-sprite" class="character player-character" src="${this.images.characters[this.player.class]}" style="height: 250px;">
                <img id="enemy-sprite" class="character enemy-character" src="${this.images.enemies[enemyType]}" style="height: 300px;">
            `;
        } else {
            document.getElementById('player-sprite').src = this.images.characters[this.player.class];
            document.getElementById('enemy-sprite').src = this.images.enemies[enemyType];
        }
        
        // Verifica se combat-message esiste, altrimenti crealo
        if (!document.getElementById('combat-message')) {
            const messageDiv = document.createElement('div');
            messageDiv.id = 'combat-message';
            document.getElementById('combat-ui').prepend(messageDiv);
        }
        
        // Verifica se combat-player-stats esiste, altrimenti crealo
        if (!document.getElementById('combat-player-stats')) {
            const statsDiv = document.createElement('div');
            statsDiv.id = 'combat-player-stats';
            document.getElementById('health-bars').prepend(statsDiv);
        }
        
        this.updateCombatUI();
        this.showCombatMessage("Il nemico ti sta affrontando!");
        this.bindCombatChoices();
        this.audio.bgMusic.pause();
        this.audio.play(this.sounds.combat);
    }

    updateCombatUI() {
        // Barre della salute
        document.getElementById('playerHealth').style.width = 
            `${(this.player.health / this.player.maxHealth) * 100}%`;
        document.getElementById('enemyHealth').style.width = 
            `${(this.combat.enemyHealth / this.combat.maxEnemyHealth) * 100}%`;
        
        // Statistiche testuali
        document.getElementById('combat-player-stats').innerHTML = `
            ${this.player.name}<br>
            HP: ${this.player.health}/${this.player.maxHealth}<br>
            MP: ${this.player.magicPower}
        `;
    }

    bindCombatChoices() {
        const actions = {
            basic: [
                { 
                    name: 'Attacco Base', 
                    execute: () => this.playerAttack(20, this.sounds.sword), // Aumentato il danno
                    available: () => true
                }
            ],
            magic: [
                { 
                    name: 'Bolla Magica', 
                    execute: () => this.playerMagicAttack(30, 15, this.sounds.magic), // Aumentato il danno
                    available: () => this.player.magicPower >= 15
                },
                { 
                    name: 'Cura Moderata', 
                    execute: () => this.playerHeal(40, 30, this.sounds.magic),
                    available: () => this.player.magicPower >= 30
                }
            ],
            special: [
                { 
                    name: 'Attacco Speciale', 
                    execute: () => this.playerSpecialAttack(),
                    available: () => !this.combat.specialUsed
                }
            ]
        };

        const container = document.getElementById('combat-choices');
        container.innerHTML = '';

        Object.entries(actions).forEach(([type, actions]) => {
            const group = document.createElement('div');
            group.className = 'action-group';
            
            actions.forEach(action => {
                if (action.available()) {
                    const btn = document.createElement('button');
                    btn.className = 'combat-btn';
                    btn.textContent = action.name;
                    btn.onclick = action.execute;
                    group.appendChild(btn);
                }
            });
            
            container.appendChild(group);
        });
    }

    playerAttack(damage, sound) {
        // Aggiungi bonus al danno in base alla classe
        if (this.player.class === 'knight') damage += 5;
        
        this.combat.enemyHealth = Math.max(this.combat.enemyHealth - damage, 0);
        this.showCombatMessage(`${this.player.name} colpisce con un attacco base! (-${damage}HP)`);
        this.audio.play(sound);
        this.resolveTurn();
    }

    playerMagicAttack(damage, cost, sound) {
        // Aggiungi bonus al danno per i maghi
        if (this.player.class === 'mage') damage += 10;
        if (this.player.class === 'darkMage') damage += 15;
        
        this.player.magicPower -= cost;
        this.combat.enemyHealth = Math.max(this.combat.enemyHealth - damage, 0);
        this.showCombatMessage(`${this.player.name} lancia una sfera magica! (-${damage}HP)`);
        this.audio.play(sound);
        this.resolveTurn();
    }

    playerHeal(amount, cost, sound) {
        // Bonus alla cura per alcune classi
        if (this.player.class === 'mage') amount += 10;
        if (this.player.choices.includes('healing')) amount += 15;
        
        this.player.magicPower -= cost;
        this.player.health = Math.min(this.player.health + amount, this.player.maxHealth);
        this.showCombatMessage(`${this.player.name} si rigenera! (+${amount}HP)`);
        this.audio.play(sound);
        this.resolveTurn();
    }

    playerSpecialAttack() {
        const specials = {
            knight: () => {
                const damage = 60; // Aumentato danno speciale
                this.combat.enemyHealth = Math.max(this.combat.enemyHealth - damage, 0);
                this.showCombatMessage(`Carica eroica! (-${damage}HP)`);
                this.audio.play(this.sounds.sword);
            },
            mage: () => {
                this.player.magicPower += 30; // Aumentato recupero mana
                this.showCombatMessage("Focalizzazione arcana! (+30MP)");
                this.audio.play(this.sounds.magic);
            },
            darkMage: () => {
                this.player.health -= 10; // Ridotto il costo di vita
                const damage = 70; // Aumentato il danno
                this.combat.enemyHealth = Math.max(this.combat.enemyHealth - damage, 0);
                this.showCombatMessage(`Drenaggio vitale! (-${damage}HP, -10HP)`);
                this.audio.play(this.sounds.magic);
            }
        };

        specials[this.player.class]();
        this.combat.specialUsed = true;
        this.resolveTurn();
    }

    resolveTurn() {
        this.updateCombatUI();

        if (this.combat.enemyHealth <= 0) {
            this.endCombat(true);
            return;
        }

        setTimeout(() => {
            this.enemyTurn();
            this.updateCombatUI();

            if (this.player.health <= 0) {
                this.endCombat(false);
                return;
            }

            this.bindCombatChoices();
        }, this.combat.enemyAttackDelay); // Usa il ritardo configurato
    }

    enemyTurn() {
        // Possibilità del 20% che il nemico manchi il colpo
        if (Math.random() < 0.2) {
            this.showCombatMessage("Il nemico manca il colpo!");
            return;
        }
        
        const enemyActions = [
            { 
                type: 'attack', 
                execute: () => {
                    // Riduciamo il danno nemico per rendere il gioco più facile
                    const damage = Math.floor(Math.random() * 10) + 5; // da 5 a 14 di danno
                    this.player.health = Math.max(this.player.health - damage, 0);
                    this.showCombatMessage(`Il nemico attacca! (-${damage}HP)`);
                    this.audio.play(this.sounds.combat);
                }
            },
            {
                type: 'special',
                execute: () => {
                    if (this.combat.enemyType === 'obscuria') {
                        // Ridotto anche il danno speciale
                        const damage = 20;
                        this.player.health = Math.max(this.player.health - damage, 0);
                        this.showCombatMessage("Obscuria scatena un'onda d'urto demoniaca! (-20HP)");
                        this.audio.play(this.sounds.magic);
                    }
                },
                condition: () => this.combat.enemyHealth < 50 && Math.random() < 0.3 // solo 30% di probabilità
            }
        ];

        const availableActions = enemyActions.filter(action => 
            !action.condition || action.condition()
        );
        
        const selectedAction = availableActions[Math.floor(Math.random() * availableActions.length)];
        selectedAction.execute();
    }

    showCombatMessage(text) {
        const messageBox = document.getElementById('combat-message');
        messageBox.textContent = text;
        messageBox.style.animation = 'none';
        void messageBox.offsetWidth; // Trigger reflow
        messageBox.style.animation = 'textScroll 3s linear';
    }

    endCombat(victory) {
        this.combatActive = false;
        document.getElementById('combat-ui').classList.add('hidden');
        this.audio.bgMusic.play();

        if (victory) {
            // Ricompense per la vittoria
            this.player.gold += 150;
            this.player.magicPower += 10;
            this.player.reputation += 2;
            
            this.showMessage(
                `<h2>Vittoria!</h2>
                 <img src="${this.images.characters[this.player.class]}" style="max-height: 250px;">
                 <p>Hai sconfitto il nemico!</p>
                 <p>Ricompensa: +150💰 +10✨ +2⭐</p>`,
                [{ text: 'Continua', action: () => {
                    this.updateStats();
                    this.nextScene();
                }}]
            );
        } else {
            this.showMessage(
                `<h2>Sconfitta...</h2>
                 <img src="${this.images.enemies[this.combat.enemyType]}" style="max-height: 250px;">
                 <p>Il tuo viaggio termina qui...</p>`,
                [{ text: 'Riprova', action: () => {
                    // Dai un'altra possibilità al giocatore
                    this.player.health = this.player.maxHealth;
                    this.player.magicPower += 20; // Bonus di consolazione
                    this.renderBetrayal();
                }}]
            );
        }
    }

    applyChoice({gold=0,magic=0,rep=0,spell=null,loyal=null}){
        this.player.gold+=gold;this.player.magicPower+=magic;this.player.reputation+=rep;
        if(spell)this.player['has'+spell+'Spell']=true;
        if(loyal!==null)this.player.isLoyal=loyal;
        if(rep<0)this.player.alignment='malvagio';
        if(rep>0 && this.player.alignment !== 'malvagio')this.player.alignment='valoroso';
        this.updateStats();this.nextScene();
    }

    buyItem(item,cost,magicBonus){
        if(this.player.gold>=cost){
            this.player.gold-=cost;
            this.player.magicPower+=magicBonus;
            this.player.inventory.push(item);
            this.updateStats();
            this.showMessage(
                `<h2>Acquisto Completato</h2>
                 <p>Hai acquistato: ${item}</p>
                 <p>Potere magico aumentato di +${magicBonus}✨</p>`,
                [{ text: 'Continua', action: () => this.nextScene() }]
            );
        } else {
            this.showMessage(
                `<h2>Fondi Insufficienti</h2>
                 <p>Non hai abbastanza oro per acquistare questo oggetto.</p>`,
                [{ text: 'Continua', action: () => this.nextScene() }]
            );
        }
    }

    showScene(title,img,dialog,choices){
        this.showMessage(
            `<h2>${title}</h2><img src="${img}" style="max-height: 250px;"><p>${dialog}</p>`,
            choices
        );
    }

    showMessage(html,choices){
        document.getElementById('message').innerHTML=html;
        const c=document.getElementById('choices');c.innerHTML='';
        choices.forEach(ch=>{
            const btn=document.createElement('button');
            btn.className='choice-btn';
            btn.textContent=ch.text;
            btn.onclick=ch.action;
            c.appendChild(btn);
        });
    }

    updateStats(){
        document.getElementById('gold').textContent=this.player.gold;
        document.getElementById('magic').textContent=this.player.magicPower;
        document.getElementById('reputation').textContent=this.player.reputation;
        document.getElementById('alignment').textContent=this.player.alignment;
    }

    nextScene(){
        this.currentSceneIndex++;
        if(this.currentSceneIndex<this.scenes.length)
            this.startScene(this.scenes[this.currentSceneIndex]);
    }

    addEnemy(type){
        const e=document.createElement('img');
        e.src=this.images.enemies[type];
        e.className='enemy-character';
        document.getElementById('characters').appendChild(e);
    }
}

// Avvio del gioco
window.game=new Game();