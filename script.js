window.addEventListener("load", function(event) {
   
    /* ==== GAME ====*/ 
    var gameObj = new Game();
    gameObj.Initialize();

    var commandObj = new Command(gameObj);
    gameObj.commandObj = commandObj;

    /* ==== GET KEY AND SEND TO GAME ====*/ 
    document.onkeydown = function (e) {
        
        gameObj.VerifyInput(e.key, true);
            
        commandObj.CheckForCommand(e.key);
    };

    document.onkeyup = function (e) {
        gameObj.VerifyInput(e.key, false);
    };
});

/* ==== GAME OBJECT ====*/ 

function Game(){
    this.playerObj;
    this.utilityObj;
    this.titleObj;
    this.commandObj;

    this.gameRunnning = false;
    this.selectedKeyList = [];
    this.keyObjList = [];
    this.keyElements;
    this.intervalID;
    this.selectKeyInterval;
    this.selectKeyIntervalMax;
    this.selectKeyIntervalMin;
    this.selectKeyIntervalSub;
    this.gameDifficulty = 'easy';

    // Game settings
    this.timeToHitKey = 3;
    
    this.selectKeyIntervalMaxEasy = 1;
    this.selectKeyIntervalMinEasy = 0.6;
    this.selectKeyIntervalSubEasy = 0.01;

    this.selectKeyIntervalMaxHard = 0.8;
    this.selectKeyIntervalMinHard = 0.4;
    this.selectKeyIntervalSubHard = 0.02;

    // ALl keys
    this.keyList = [
        'q','w','e','r','t','y','u','i','o','p',
        'a','s','d','f','g','h','j','k','l',';',
        'z','x','c','v','b','n','m',',','.','/',' '
    ]

    // Section of keys per finger
    this.keySectionList = [
        ['q','a','z'],
        ['w','s','x'],
        ['e','d','c'],
        ['r','f','v','t','g','b'],
        ['y','h','n','u','j','m'],
        ['i','k',','],
        ['o','l','.'],
        ['p',';','/'],
        [' ']
    ]

    // Initialize game
    this.Initialize = function(){
        this.utilityObj = new Utility();
        this.titleObj = new TextPrompt(document.getElementById('title'));
        this.subtitleObj = new TextPrompt(document.getElementById('subtitle'));
        this.playerObj = new Player(this, this.utilityObj, this.titleObj, this.subtitleObj);
        this.keyElements = document.getElementsByClassName('key');

        this.titleObj.EnterText('Typing Game');
        this.subtitleObj.EnterText('press enter');

        // Create key objects
        for (i = 0; i < this.keyList.length; i++){
            this.keyObjList.push(new Key(this,
                this.utilityObj,
                this.playerObj,
                this.keyList[i], 
                this.keyList[i] == ' ' ? this.FindKeyElem('SPACE') : this.FindKeyElem(this.keyList[i]),
                this.timeToHitKey));
        }
    }

    // Verify correct input pressed, and
    // whether its on down or up
    this.VerifyInput = function(key, isDown){
        if (key == 'Enter' && isDown)
            this.gameRunnning == false ? this.StartGame() : this.EndGame(false);
        else if (this.keyList.includes(key) && isDown)
            this.FindKeyObj(key).OnPressDown();
        else if (this.keyList.includes(key) && !isDown)
            this.FindKeyObj(key).OnPressUp();
    }

    // Reset game, start game loop
    this.StartGame = function(){
        this.ResetKeys();
        this.gameRunnning = true;
        this.playerObj.GameStarted();
        this.playerObj.DisplayStats(false);
        document.getElementById('helpHint').style.visibility = 'hidden';

        // Select difficult
        this.selectKeyIntervalMax = this.gameDifficulty == 'easy' ? this.selectKeyIntervalMaxEasy : this.selectKeyIntervalMaxHard;
        this.selectKeyIntervalMin = this.gameDifficulty == 'easy' ? this.selectKeyIntervalMinEasy : this.selectKeyIntervalMinHard;
        this.selectKeyIntervalSub = this.gameDifficulty == 'easy' ? this.selectKeyIntervalSubEasy : this.selectKeyIntervalSubHard;

        this.selectKeyInterval = this.selectKeyIntervalMax;
    
        // Start selecting keys
        this.SelectRandomKey();
    }

    // Stop game loop
    this.EndGame = function(isLoss){
        this.gameRunnning = false;
        this.playerObj.GameEnded();
        document.getElementById('helpHint').style.visibility = 'visible';

        if (isLoss){
            this.titleObj.EnterText('Game Over');
            this.playerObj.DisplayStats(true);
        }
        else
            this.titleObj.EnterText('Typing Game');

        this.subtitleObj.EnterText('press enter');

        this.ResetKeys();
        clearInterval(this.intervalID);
    }

    // Reset selected keys
    this.ResetKeys = function(){
        // Unselect selected keys
        for (i = 0; i < this.keyObjList.length; i++){
            if (this.keyObjList[i].isSelected)
                this.keyObjList[i].DeselectKey();
        }

        // Clear list
        this.selectedKeyList = [];
    }

    // Select a random key
    this.SelectRandomKey = function(){
        if (!this.gameRunnning) return;

        // Filter already selected keys from key list
        let newKeyList = this.GetValidKeyList();

        // If all keys selected, don't select 
        if (newKeyList.length == 0){
            return;
        }
        
        // Select random key  
        let selKey = newKeyList[Math.floor(Math.random() * newKeyList.length)];
        this.FindKeyObj(selKey).SelectKey();

        // Repeat on interval, change interval to increase difficulty
        if ((this.selectKeyInterval - this.selectKeyIntervalSub) > this.selectKeyIntervalMin)
            this.selectKeyInterval = (this.selectKeyInterval - this.selectKeyIntervalSub);

        this.intervalID = setTimeout(() => {
            this.SelectRandomKey();
        }, this.selectKeyInterval * 1000);
    }

    // Returns list of valid keys that can be selected
    this.GetValidKeyList = function(){
        let tempList = this.keyList;
        for (i = 0; i < this.keyObjList.length; i++){
            if (!this.keyObjList[i].isSelected) continue;

            for (ind = 0; ind < this.keySectionList.length; ind++){
                if (this.keySectionList[ind].includes(this.keyObjList[i].letter)){
                    tempList = this.utilityObj.FilterArray(tempList, this.keySectionList[ind])
                    continue;
                }
            }
        }

        return tempList;
    }

    // Return key obj that matches letter
    this.FindKeyObj = function(letter){
        for (i = 0; i < this.keyObjList.length; i++){
            if (this.keyObjList[i].letter == letter)
                return this.keyObjList[i];
        }
        return null;
    }

    // Returns key element that matches letter
    this.FindKeyElem = function(letter){
        for (i = 0; i < this.keyElements.length; i++){
            if (this.keyElements.item(i).innerHTML.toUpperCase() == letter.toUpperCase()){
                return this.keyElements[i]
            }
        }

        return null;
    }
}

/* ==== COMMANDS OBJECT ====*/

function Command(gameObj){
    this.gameObj = gameObj;
    this.utilityObj = new Utility();
    this.modal = document.getElementById('myModal');
    this.letterList = '';
    this.commandList = [
        'help',
        'easy',
        'hard',
        'credits',
        'flip',
        'light',
        'dark',
        'milos',
        'kitty'
    ]

    this.isFlipped = false;
    this.lightMode = false;

    this.CheckForCommand = function(letter){
        if (gameObj.gameRunnning) return;

        // Close modal on escape
        if (letter == 'Escape'){
            this.modal.style.display = 'none';
        }
        
        // Select command based on what is typed
        this.letterList += letter;
        for (i = this.commandList.length-1; i > -1; i--){
            let commandStr = this.commandList[i];

            if (commandStr.charAt(commandStr.length-1) == letter){
                let command = this.letterList.slice(this.letterList.length - commandStr.length, this.letterList.length);

                if (commandStr == command){
                    this.FindCommand(commandStr);
                    return;
                }
            }
        }
    }

    // Find command that was typed
    this.FindCommand = function(command){
        switch (command){
            case 'help':
                this.HelpCommand();
                break;
            case 'easy':
                this.ChangeDifficulty('easy');
                break;
            case 'hard':
                this.ChangeDifficulty('hard');
                break;
            case 'credits':
                this.Credits();
                break;
            case 'flip':
                this.Flip();
                break;
            case 'light':
                this.Light();
                break
            case 'dark':
                this.Dark();
                break;
            case 'milos':
                this.Milos();
                break;
            case 'kitty':
                this.Kitty();
                break;
        }
    }

    // Help command to display other commands
    this.HelpCommand = function(){
        this.utilityObj.Toast('Command List<br>Easy: Set difficulty to easy<br>Hard: Set difficulty to hard<br>Light: Let there be light!<br>Dark: The better look<br>Credits: See my name<br>Flip: Do a flip!<br>Milos: For my bf <3 <br> Kitty: Kitty', 5);
    }

    // Change difficulty of game
    this.ChangeDifficulty = function(difficulty){
        this.gameObj.gameDifficulty = difficulty;
        this.utilityObj.Toast('Difficulty set to ' + difficulty, 3);
    }

    // Display credits
    this.Credits = function(){
        this.gameObj.titleObj.EnterText('Tamara Canadi');
        this.gameObj.subtitleObj.EnterText('I made this :]');
    }

    // Flip the keyboard
    this.Flip = function(){
        this.isFlipped = !this.isFlipped;

        let keyboard = document.getElementById('keyboard');
        let pigImg = document.getElementById('pigImg');
        if (this.isFlipped){
            keyboard.style.transform = 'scaleY(-1) scaleX(-1)';
            pigImg.style.transform = 'scaleY(-1) scaleX(-1)';
        }
        else{
            keyboard.style.transform = 'scaleY(1) scaleX(1)';
            pigImg.style.transform = 'scaleY(1) scaleX(1)';
        }
    }

    // Light mode
    this.Light = function(){
        let body = document.body;
        let titleContainer = document.getElementById('titleContainer');
        let keys = document.getElementsByClassName('key');
        let statsContainer = document.getElementById('statsContainer');

        body.style.backgroundColor = "white";
        body.style.color = "black";

        titleContainer.style.borderColor = "black";
        for (i=0; i<keys.length; i++)
            keys[i].style.borderColor = "black";

        statsContainer.style.borderLeftColor = "black";
        statsContainer.style.borderRightColor = "black";

        this.lightMode = true;
    }

    // Dark mode
    this.Dark = function(){
        let body = document.body;
        let titleContainer = document.getElementById('titleContainer');
        let keys = document.getElementsByClassName('key');
        let statsContainer = document.getElementById('statsContainer');

        body.style.backgroundColor = "black";
        body.style.color = "white";

        titleContainer.style.borderColor = "white";
        for (i=0; i<keys.length; i++)
            keys[i].style.borderColor = "white";

        statsContainer.style.borderLeftColor = "white";
        statsContainer.style.borderRightColor = "white";

        this.lightMode = false;
    }

    // Milos mode
    this.Milos = function(){
        let body = document.body;
        let titleContainer = document.getElementById('titleContainer');
        let keys = document.getElementsByClassName('key');
        let statsContainer = document.getElementById('statsContainer');

        body.style.backgroundColor = "black";
        body.style.color = "pink";

        titleContainer.style.borderColor = "pink";
        for (i=0; i<keys.length; i++)
            keys[i].style.borderColor = "pink";

        statsContainer.style.borderLeftColor = "pink";
        statsContainer.style.borderRightColor = "pink";

        this.lightMode = false;

        this.gameObj.titleObj.EnterText('I love Milos!! c:');
        this.gameObj.subtitleObj.EnterText('♥♥♥♥♥♥♥♥♥♥');
    }

    // Kitty mode
    this.Kitty = function(){
        let kittyImg = document.getElementById('kittyImg');
        kittyImg.style.opacity = kittyImg.style.opacity == 1 ? 0 : 1;
    }
}

/* ==== PLAYER OBJECT ====*/

function Player(gameObj, utilityObj, titleObj, subtitleObj){
    this.gameObj = gameObj;
    this.utilityObj = utilityObj;
    this.titleObj = titleObj;
    this.subtitleObj = subtitleObj;

    this.lives = 0;
    this.score = 0;
    this.hitKeys = 0;
    this.missedKeys = 0;
    this.timeToHitKeyList = [];

    // Player settings

    this.startingLives = 5; // Amount of lives for player
    this.hitKeyAddScore = 100; // Added score on succesful hit
    this.timerMultiScore = 3; // Score max multiplier for fastest reaction time

    // Setup on game startup
    this.GameStarted = function(){
        this.lives = this.startingLives;
        this.score = 0;
        this.hitKeys = 0;
        this.missedKeys = 0;
        this.timeToHitKeyList = [];

        this.titleObj.EnterText('0');
        this.subtitleObj.EnterText(('♥').repeat(this.lives));
    }

    // Action on game ended
    this.GameEnded = function(){
    }

    this.KeyAction = function(isHit, timeToHitKey=0){
        if (!this.gameObj.gameRunnning) return;

        // Count hit/missed keys
        if (isHit){
            // Update counter
            this.hitKeys++;
            // Track how long it takes to hit correct key
            this.timeToHitKeyList.push(timeToHitKey);
        }
        else{
            // Update counters
            this.missedKeys++;
            this.lives--;
            
            // Update lifes text
            this.subtitleObj.EnterText(('♥').repeat(this.lives));
            this.utilityObj.PlayAnimation(this.subtitleObj.element, 'shake', '0.3');
            

            this.lives <= 0 ? this.gameObj.EndGame(true) : null;
        }

        this.UpdateScore(isHit, timeToHitKey);
    }

    // Update score according to action
    this.UpdateScore = function(isHit, timeToHitKey=0){
        if (!this.gameObj.gameRunnning || !isHit) return;

        // Add score if hit correct key
        // Multiply score depending on how fast key was pressed
        this.score += Math.floor(this.hitKeyAddScore * ((1 - (timeToHitKey / this.gameObj.timeToHitKey)) * this.timerMultiScore));
        
        // Update score text
        this.titleObj.EnterText('' + this.score);

        // Animation for adding to score
        this.utilityObj.PlayAnimation(this.titleObj.element, 'scoreAdded', '0.5', 'ease-in-out');
    }

    this.DisplayStats = function(isDisplaying){
        // Choose to display or not display stats
        let statContainer = document.getElementById('statsContainer');

        if (isDisplaying){
            this.utilityObj.PlayAnimation(statContainer, 'fadeIn', 0.5, 'ease-in-out');
            setTimeout(() => {
                statContainer.style.opacity = 1;
            }, 500);
        }else{
            if (statContainer.style.opacity == 0) return;
            this.utilityObj.PlayAnimation(statContainer, 'fadeOut', 0.5, 'ease-in-out');
            setTimeout(() => {
                statContainer.style.opacity = 0;
            }, 500);
            return;
        }

        // Enter stats 
        let statElm = document.getElementsByClassName('statsItem');

        statElm[0].innerHTML = this.score;
        statElm[1].innerHTML = this.hitKeys;
        statElm[2].innerHTML = this.missedKeys;

        let sum = 0;
        for (let num of this.timeToHitKeyList){
            sum += num;
        }
        sum = sum == 0 ? 0 : (sum / this.timeToHitKeyList.length).toFixed(2);
        statElm[3].innerHTML = sum + 's/key';
    }
}

/* ==== KEY OBJECT ====*/ 

function Key(gameObj, utilityObj, playerObj, letter, element, timeToHitKey){
    this.gameObj = gameObj;
    this.utilityObj = utilityObj;
    this.playerObj = playerObj;
    this.timeToHitKey = timeToHitKey;
    this.letter = letter;
    this.element = element;
    this.isSelected = false;

    this.timer = 0;
    this.timeoutID;

    // Key settings
    this.defaultTransition = 0.2;

    // On key down
    this.OnPressDown = function(){
        this.element.classList.add('pressed');

        if (!gameObj.gameRunnning) return;
        // Check if can deselect key
        if (this.isSelected){
            this.DeselectKey(true);

            // Animation for key hit when selected
            this.utilityObj.PlayAnimation(this.element, gameObj.commandObj.lightMode == true ? 'correctKeyAnimLight' : 'correctKeyAnim', '0.4', 'ease-in-out');
        }else{
            this.playerObj.KeyAction(false);

            // Animation for key hit when not selected
            this.utilityObj.PlayAnimation(this.element, gameObj.commandObj.lightMode == true ? 'incorrectKeyAnimLight' : 'incorrectKeyAnim', '0.4', 'ease-in-out');
        }
    }

    // On key up
    this.OnPressUp = function(){
        this.element.classList.remove('pressed');
    }

    // Select key
    this.SelectKey = function(){
        this.isSelected = true;

        this.element.style.transition = this.timeToHitKey + 's ease-out';
        this.element.classList.add('selected');
        // Start timer
        this.StartTimer()
    }

    // Deselect key
    this.DeselectKey = function(isOnTime){
        this.isSelected = false;

        this.element.style.transition = this.defaultTransition + 's ease-out';
        this.element.classList.remove('selected');
        
        // Cancel timer
        clearTimeout(this.timeoutID)

        if (isOnTime == null)
            return;

        // Communicate with player depending on outcome
        if (isOnTime){
            this.playerObj.KeyAction(true, (Date.now() - this.timer) / 1000);
        }else{
            // Animation for key not getting hit on time
            this.utilityObj.PlayAnimation(this.element, gameObj.commandObj.lightMode == true ? 'incorrectKeyAnimLight' : 'incorrectKeyAnim', '0.4', 'ease-in-out');

            this.playerObj.KeyAction(false);
        }
    }   

    // Start timer after being selected
    // Lose game if key is still selected after timer ends
    this.StartTimer = function(){
        _this = this;
        this.timeoutID = setTimeout(() => {
            if (this.isSelected && this.gameObj.gameRunnning){
                this.DeselectKey(false);
            }
        }, this.timeToHitKey * 1000);
        this.timer = Date.now();
    }
}

/* ==== TEXT PROMPT OBJECT ====*/ 

function TextPrompt(element){
    this.element = element;
    this.typingTimeoutIds = [];
    this.typeInterval = 80;

    // Start typing if empty, or delete then start typing
    this.EnterText = function(text){
        // Stop current typing
        this.ClearTimeouts();

        this.TypeText(text, this.element.innerHTML.length >= text.length ? this.element.innerHTML.length : text.length);
    }

    // Enter text letter by letter, with an interval
    // If text is already present, replace
    this.TypeText = function(text, loop, curIndex=0){
        // End of recursion
        if (loop <= 0) return;
 
        // If targetting index that the element does not have, add to it
        // Otherwise, replace at index
        let str = this.element.innerHTML;
        if (curIndex >= str.length){
            str += curIndex >= text.length ? '&#8203' : text[curIndex];
        }else{
            str = setCharAt(str, curIndex, curIndex >= text.length ? '&#8203' : text[curIndex]);
        }

        // Update text
        this.element.innerHTML = str;

        // Update counters
        loop--;
        curIndex++;

        // Recursion
        this.typingTimeoutIds.push(setTimeout(() => {
            this.TypeText(text, loop, curIndex);
        }, this.typeInterval));
    }

    // Clear all timeouts
    this.ClearTimeouts = function(){
        for (i = 0; i < this.typingTimeoutIds.length; i++){
            clearTimeout(this.typingTimeoutIds[i]);
        }
        this.typingTimeoutIds = [];
    }

    // Replace char in string
    function setCharAt(str,index,chr) {
        if(index > str.length-1) return str;
        return str.substring(0,index) + chr + str.substring(index+1);
    }
}

/* ==== UTILITY OBJECT ====*/ 

function Utility(){
    this.toastTimeoutId;

    // Filter array from another
    this.FilterArray = function(arr1, arr2){
        const filtered = arr1.filter(el => {
        return arr2.indexOf(el) === -1;
        });
        return filtered;
    };

    // Play animation
    this.PlayAnimation = function(element, animName, time, animSetting=''){
        element.style.animation = '';
        element.offsetWidth;
        element.style.animation = animName + ' ' + ( animSetting == '' ? '' : (animSetting + ' ')) + time + 's';
    }

    this.Toast = function(str, timeToShow){
        var snackbarElm = document.getElementById("snackbar");

        clearTimeout(this.toastTimeoutId);
        snackbarElm.innerHTML = str;
        this.PlayAnimation(snackbarElm, 'fadein 0.5s, fadeout 0.5s', timeToShow-0.5);
        snackbarElm.style.visibility = 'visible';

        this.toastTimeoutId = setTimeout(() => 
        {
            snackbarElm.style.visibility = 'hidden';
        }, timeToShow * 1000);
    }
}