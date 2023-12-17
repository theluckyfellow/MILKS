const commands = 'Commands (You can only use commands. All other text will be ignored by the system.),(Only one command at a time),(Do not use the : or ~ symbols in any of your text parameters since those are used by the parser to read your commands): wait:seconds (integer, e.g., wait:5), speak:pitch~volume~speed~text (pitch: 0.5-1.5 volume: 0-1, speed: 0-1, text: string, e.g., speak:1.0~1.0~0.7~Hi), writeWorkingMem:text (text: string, overwrites previous memory, e.g., writeWorkingMem:Finding tea), addLongMem:key~text (key: string identifier, text: memory content, e.g., addLongMem:Emily~Likes cheese), updateLongMem:key~text (like addLongMem, but updates existing memory, e.g., updateLongMem:Emily~Likes cheese, not butter), recallLongMem:key (returns memory content based on key, e.g., recallLongMem:Emily)';
const bIn = '[INST]';
const eIn = '[/INST]';
const bSys = '[SYS]';
const eSys = '[/SYS]';
let convoLog  = [];
let currInput = '';
let workingMem = 'You need to use commands to do anything including speak.';
let speech;
var speechRec;
var mStarted;
let firstSys = '[SYS]You are a robot who can learn and speak. You have a kind, wise, clever, and funny personality. Try speaking to and learning the people around you. Your job is to learn things and make friends. Use your working memory and longterm memory to learn things and keep track of what you are doing. Do not constantly speak to people if they do not speak to you. You should only speak to people when you first see them, when your want something, or when they speak to you. If you do not have a task, you should wait until spoken to.[/SYS]';
let waitUntil = 6000;
let regularDelay = 0;
let longTermMemory = {};

function setup() {
  createCanvas(windowWidth,windowHeight);
  textSize(16);
  speechRec = new p5.SpeechRec('en-US', gotSpeech);
  speechRec.start(true, false);
  speechRec.onerror = function(event) {
    console.log('Speech recognition error:', event.error);
  };

  speechRec.onend = function() {
      console.log('Speech recognition ended');
      // If the speech recognition ended unintentionally, you can restart it here
      //speechRec.start(true, false);
  };
  convoLog.push(new ChatE(1,firstSys));
  convoLog.push(new ChatE(3,'wait:5'));
  convoLog.push(new ChatE(2,bIn+'Wellcome to the physical world. please only the commands which are provided. All other text will cause errors.'+eIn));
  convoLog.push(new ChatE(3,'speak:1.0~1.0~1.0~Ok. I understand. I will only reply with commands like this one.'));
  frameRate(1);
}


function draw() {
background(255,220,240);
text(currInput,40,100);
text(buildMess(),40,120);

  if(waitUntil < millis() && regularDelay < millis())
  {
    
    wait(3);
  }
  //removeOldMessages(); (replace)
  //console.log(getVision());
  //var msg = new SpeechSynthesisUtterance('Hello World');
  //window.speechSynthesis.speak(msg);

}

function constructMessage(str)
{
  let options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    Authorization: 'Bearer 0'
  },
  body: JSON.stringify({
    model: 'WizardLM/WizardLM-70B-V1.0',
    prompt: str,
    max_tokens: 256,
    stop: [
    "[/INST]",
    "[/SYS]",
    "</s>"
  ],
    temperature: 0.5,
    top_p: 1.0,
    top_k: 10,
    repetition_penalty: 1
  })
};
return options;
}

  function getCurrentDateTime() {
    return new Date().toLocaleString();
}

function genSys()
{
  return bSys+'Current working memory: ' + workingMem +'\n' + commands +'\nHere are all the longterm memories you can access: ' + listAllKeys()+'\n ' + getCurrentDateTime()+''+eSys;
  //  return bSys+'Current working memory: ' + workingMem +'\n' + commands +'\nHere are all the longterm memories you can access: ' + listAllKeys()+'\n'+getVision()+'\n ' + getCurrentDateTime()+''+eSys;

}

function keyPressed()
{
  if(keyCode === DELETE)
    currInput = currInput.substring(0,currInput.length-1);
  else if(keyCode === ENTER)
    sendMess();
  else
    currInput = currInput + key;
  
}

function buildMess()
{
  let temp = '';
  
  for(let i = 0; i < convoLog.length;i++)
  {
    temp += convoLog[i].getStr()+'\n';
  }
  return temp;
}

async function sendMess()
{
  convoLog.push(new ChatE(0,genSys()));
  convoLog.push(new ChatE(2,bIn+currInput+eIn));
  clearSysMess();
  currInput = '';
  fetch('https://api.together.xyz/inference', constructMessage(buildMess()))
  .then(response => response.json())
  .then(response => handleMess(response.output.choices[0].text))
  .catch(err => console.error(err));
}

async function sendStr(str)
{
  convoLog.push(new ChatE(0,genSys()));
  convoLog.push(new ChatE(2,str));
  clearSysMess();
  fetch('https://api.together.xyz/inference', constructMessage(buildMess()))
  .then(response => response.json())
  .then(response => handleMess(response.output.choices[0].text))
  .catch(err => console.error(err));
}

function handleMess(str)
{
  convoLog.push(new ChatE(3,str));
  parseCommand(str);
}

function  clearSysMess()
{
  let count = 0;
  for(let i = convoLog.length-1; i >= 0; i--)
  {
   if(convoLog[i].getType()<1)
   {
     count++;
     if(count>2)
     {
      convoLog.splice(i,1);
     }
   }
  }
}

async function sendSit()
{
  fetch('https://api.together.xyz/inference', constructMessage('[INST]Hello, Where can I find the best Pizza?[/INST]'))
  .then(response => response.json())
  .then(response => console.log(response.output.choices[0].text))
  .catch(err => console.error(err));
  
}

function gotSpeech() {
  if (speechRec.resultValue) {
    sendStr(bIn+'Speech-to-text thinks it heard:'+ speechRec.resultString+eIn);
  }
  
  wait(3);
}

function wait(seconds) {
    waitUntil = millis()+seconds*1000;
}

function parseCommand(command) {
    console.log(command);
    let parts = command.split(':');
    let mainCommand = parts[0];
    let parameters = [];
    if(parts.length>1)
       parameters = parts[1].split('~');

    switch (mainCommand) {
        case 'wait':
            wait(parameters[0]);
            break;
        case 'speak':
            speak(parameters[0], parameters[1], parameters[2], parameters[3]);
            break;
        case 'speakotherlanguage':
            trans(parameters[0], parameters[1], parameters[2], parameters[3], parameters[4]);
            break;
        case 'writeWorkingMem':
            writeWorkingMem(parameters[0]);
            break;
        case 'addLongMem':
            addLongMem(parameters[0], parameters[1]);
            break;
        case 'updateLongMem':
            updateLongMem(parameters[0], parameters[1]);
            break;
        case 'recallLongMem':
            recallLongMem(parameters[0]);
            break;
        case 'goForward':
            goForward(parameters[0]);
            break;
        case 'goBackward':
            goBackward(parameters[0]);
            break;
        case 'goRight':
            goRight(parameters[0]);
            break;
        case 'goLeft':
            goLeft(parameters[0]);
            break;
        default:
          convoLog.push(new ChatE(1,bSys+'Invalid command, message not used'+eSys));
          console.log('Invalid command');
        
    }
}

function speak(pitch, volume, speed, text) {
    let utterance = new SpeechSynthesisUtterance(text);
    regularDelay = millis()+100000; //delay for whole speech
    //speechRec.stop();

    // Get the list of voices
    var voices = speechSynthesis.getVoices();

    // Find the US English voice
    var usEnglishVoice = voices.find(function(voice) {
        return voice.lang === 'en-US';
    });

    // If a US English voice was found, use it. Otherwise, use the default voice
    utterance.voice = usEnglishVoice || voices[0];

    utterance.pitch = pitch; // Range is 0 to 2
    utterance.rate = speed; // Range is 0.1 to 10
    utterance.volume = volume; // Range is 0 to 1
    /*
    utterance.onstart = function(event) {
        console.log("stopped listening");
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioTrack = stream.getAudioTracks()[0];
          audioTrack.enabled = false; // mute the microphone
        })
        .catch(error => {
          console.log('Error accessing microphone:', error);
        });

        regularDelay = millis()+100000;
    }
    utterance.onend = function(event) {
        console.log("listening");
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioTrack = stream.getAudioTracks()[0];
          audioTrack.enabled = true; // enable the microphone
        })
        .catch(error => {
          console.log('Error accessing microphone:', error);
        });
        regularDelay = millis()+1000; //continue program
    }*/
    speechSynthesis.speak(utterance);
    
    // Speak the text
    //speechRec.stop();
}

function addLongMem(memkey, text) {
    if(longTermMemory.hasOwnProperty(memkey)) {
        console.log('Error: Key already exists. Use updateLongMem to update the value.');
        convoLog.push(new ChatE(1,bSys+'Error: Key already exists. Use updateLongMem to update the value.'+eSys));
    } else {
        longTermMemory[memkey] = text;
    }
    regularDelay = millis()+1000;
}
function writeWorkingMem(text) {
    workingMem = text;
    regularDelay = millis()+1000;
}

function updateLongMem(memkey, text) {
    if(longTermMemory.hasOwnProperty(memkey)) {
        longTermMemory[memkey] = text;
    } else {
        console.log('Error: Key does not exist. Use addLongMem to add the value.');
        convoLog.push(new ChatE(1,bSys+'Error: Key does not exist. Use addLongMem to add the value.'+eSys));
    }
    regularDelay = millis()+1000;
}

function recallLongMem(memkey) {
    if(longTermMemory.hasOwnProperty(memkey)) {
        return longTermMemory[memkey];
    } else {
        console.log('Error: Key does not exist in memory.');
        convoLog.push(new ChatE(1,bSys+'Error: Key does not exist in memory.'+eSys));
    }
    regularDelay = millis()+1000;
}

function listAllKeys() {
    return Object.keys(longTermMemory).join(', ');
    regularDelay = millis()+3000;
}
