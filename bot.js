const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const token = '6854969214:AAGiuim4Pcaca5wEOSphNefyoN--e-xcmYI';
const bot = new TelegramBot(token, { polling: true });

const captains = {
  kosar: 5167117549,
  zhiar: 987654321,
  ayman: 112233445,
  safo: 1130039353,
  bruce: 556677889,
  kenley: 667788990
};
bot.onText(/\/info (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1].trim(); 

  if (msg.from.id === 5167117549) {  
    const infoFilePath = path.join('info.json');

    fs.readFile(infoFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading info.json:', err);
        return;
      }

      let infoUsers = [];
      if (data) {
        try {
          infoUsers = JSON.parse(data);
        } catch (e) {
          console.error('Error parsing info.json:', e);
        }
      }

      const userInfo = infoUsers.filter(entry => 
        entry['User ChatId'] === input || 
        entry['Unbanned ChatId'] === input
      );

      if (userInfo.length > 0) {
        const formattedInfo = userInfo.map(user => {
          return `
            User: ${user['Banned User'] || user['Unbanned User']}
            ChatId: ${user['User ChatId'] || user['Unbanned ChatId']}
            Reason: ${user['Reason of Ban'] || 'N/A'}
            Date: ${user['Date and Time']}
            Captain: ${user['Captain Name'] || user['Captain']}
          `;
        }).join('\n\n'); 

        bot.sendMessage(chatId, `Information for ${input}:\n\n${formattedInfo}`);
      } else {
        bot.sendMessage(chatId, `No information found for ${input}.`);
      }
    });
  } else {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
  }
});

bot.onText(/\/ban (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const bannedChatId = match[1];

  if (Object.values(captains).includes(msg.from.id)) {
    bot.sendMessage(chatId, "Please provide a reason for banning this user.");

    bot.once('message', (reasonMsg) => {
      const reason = reasonMsg.text;

      bot.getChat(bannedChatId).then((user) => {
        const bannedUserName = user.username || 'Unknown'; 
        const captainName = msg.from.first_name + ' ' + msg.from.last_name;

        const bannedInfo = {
          "Banned User": bannedUserName,
          "User ChatId": bannedChatId,
          "Reason of Ban": reason,
          "Date and Time": new Date().toISOString(),
          "Captain Name": captainName
        };

        const bannedFilePath = path.join('banned.json');
        const infoFilePath = path.join('info.json');

        fs.readFile(bannedFilePath, 'utf8', (err, data) => {
          let bannedUsers = [];
          if (!err && data) {
            bannedUsers = JSON.parse(data);
          }
          bannedUsers.push(bannedInfo);

          fs.writeFile(bannedFilePath, JSON.stringify(bannedUsers, null, 2), (err) => {
            if (err) {
              console.error('Error writing to banned.json:', err);
            }
          });
        });

        fs.readFile(infoFilePath, 'utf8', (err, data) => {
          let infoUsers = [];
          if (!err && data) {
            infoUsers = JSON.parse(data);
          }
          infoUsers.push(bannedInfo);

          fs.writeFile(infoFilePath, JSON.stringify(infoUsers, null, 2), (err) => {
            if (err) {
              console.error('Error writing to info.json:', err);
            }
          });
        });

        bot.sendMessage(chatId, `User @${bannedUserName} has been banned for the following reason: ${reason}`);
      }).catch(err => {
        bot.sendMessage(chatId, 'Unable to find the user with the provided Chat ID.');
        console.error('Error getting user info:', err);
      });
    });
  } else {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
  }
});

bot.onText(/\/unban (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const unbannedChatId = match[1];

  if (Object.values(captains).includes(msg.from.id)) {
    const bannedFilePath = path.join('banned.json');
    const unbanFilePath = path.join('unban.json');
    const infoFilePath = path.join('info.json');

    fs.readFile(bannedFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading banned.json:', err);
        return;
      }
      let bannedUsers = [];
      if (data) {
        try {
          bannedUsers = JSON.parse(data);
        } catch (e) {
          console.error('Error parsing banned.json:', e);
        }
      }

      const bannedUserIndex = bannedUsers.findIndex((user) => user['User ChatId'] === unbannedChatId);

      if (bannedUserIndex === -1) {
        bot.sendMessage(chatId, 'No user found with the provided chat ID in the banned list.');
        return;
      }

      const bannedUser = bannedUsers[bannedUserIndex];
      const captainName = msg.from.first_name + ' ' + msg.from.last_name;

      const unbanInfo = {
        "Unbanned User": bannedUser['Banned User'],
        "Unbanned ChatId": bannedUser['User ChatId'],
        "Date and Time": new Date().toISOString(),
        "Captain": captainName
      };

      bannedUsers.splice(bannedUserIndex, 1);

      fs.writeFile(bannedFilePath, JSON.stringify(bannedUsers, null, 2), (err) => {
        if (err) {
          console.error('Error writing to banned.json:', err);
        }
      });

      fs.readFile(unbanFilePath, 'utf8', (err, data) => {
        let unbanUsers = [];
        if (!err && data) {
          try {
            unbanUsers = JSON.parse(data);
          } catch (e) {
            console.error('Error parsing unban.json:', e);
          }
        }

        unbanUsers.push(unbanInfo);

        fs.writeFile(unbanFilePath, JSON.stringify(unbanUsers, null, 2), (err) => {
          if (err) {
            console.error('Error writing to unban.json:', err);
          }
        });
      });

      fs.readFile(infoFilePath, 'utf8', (err, data) => {
        let infoUsers = [];
        if (!err && data) {
          try {
            infoUsers = JSON.parse(data);
          } catch (e) {
            console.error('Error parsing info.json:', e);
          }
        }

        infoUsers.push(unbanInfo);

        fs.writeFile(infoFilePath, JSON.stringify(infoUsers, null, 2), (err) => {
          if (err) {
            console.error('Error writing to info.json:', err);
          }
        });
      });

      bot.sendMessage(chatId, `User @${bannedUser['Banned User']} has been unbanned.`);
    });
  } else {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
  }
});

const turnCounters = {
  kosar: 1,
  zhiar: 1,
  ayman: 1,
  safo: 1,
  bruce: 1,
  kenley: 1
};

let userSession = {};
let userLastInquiryTime = {}; 

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: 'English', callback_data: 'language_english' },
        { text: 'Arabic', callback_data: 'language_arabic' },
        { text: 'Kurdish Sorani', callback_data: 'language_kurdish' }  
      ]
    ]
  };

  bot.sendMessage(chatId, 'Please choose a language\n\nتکایە زمانێک هەڵبژێرە\n\nالرجاء اختيار اللغة', { reply_markup: replyMarkup });
});

bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith('language_')) {
    const language = data.split('_')[1]; 
    userSession[chatId] = { ...userSession[chatId], language }; 

    let responseMessage = '';
    switch (language) {
      case 'english':
        responseMessage = 'Hello, welcome to Helper Bot. Please choose which captain you want to contact.';
        break;
      case 'arabic':
        responseMessage = 'مرحباً، أهلاً بك في بوت المساعد. يرجى اختيار الكابتن الذي ترغب في التواصل معه.';
        break;
      case 'kurdish':
        responseMessage = 'سڵاو بەڕێز بەخێربێت بۆ بۆتی یارمەتی دەر. تکایە ئەو دابەشکارە هەڵبژێرە کە ئەتەوێ پەیوەندی پێوە بکەی.'; 
        break;
      default:
        responseMessage = 'Please choose a language.';
    }

    bot.sendMessage(chatId, responseMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Kosar Tarkhany', callback_data: 'captain_kosar' },
            { text: 'Zhiar Mohammed', callback_data: 'captain_zhiar' },
            { text: 'Ayman Shexbzene', callback_data: 'captain_ayman' }
          ],
          [
            { text: 'Safo Gym', callback_data: 'captain_safo' },
            { text: 'Bruce Chan', callback_data: 'captain_bruce' },
            { text: 'Kenley Zhang', callback_data: 'captain_kenley' }
          ]
        ]
      }
    });

    bot.answerCallbackQuery(callbackQuery.id);
  }

  if (data.startsWith('captain_')) {
    const captainKey = data.split('_')[1];
    if (captains[captainKey]) {
        const chatId = callbackQuery.message.chat.id;

        const bannedFilePath = path.join('banned.json');
        let bannedUsers = [];

        try {
            const fileContent = fs.readFileSync(bannedFilePath, 'utf8');
            bannedUsers = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading or parsing the banned.json file:', error.message);
        }

        const isUserBanned = bannedUsers.some(banned => banned["User ChatId"] === chatId.toString());
        if (isUserBanned) {
          bot.sendMessage(chatId, "You are restricted from sending inquiries to captains.\n\nتۆ ڕاگیراویت لەسەر ئەوەی  داواکاری بنێری بۆ دابەشکارەکان\n\nأنت ممنوع من إرسال الاستفسارات إلى الكباتن.");
            bot.answerCallbackQuery(callbackQuery.id);
            return; 
        }

        const currentTime = Date.now();
        const lastInquiryTime = userLastInquiryTime[chatId];

        if (lastInquiryTime && (currentTime - lastInquiryTime < 30 * 60 * 60 * 1000)) {
            const remainingTime = (30 * 60 * 60 * 1000 - (currentTime - lastInquiryTime));
            const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

            const language = userSession[chatId].language || 'english';

            const cooldownMessage = {
                english: `You have sent an inquiry! You can't send another one till ${remainingHours} hours and ${remainingMinutes} minutes!`,
                arabic: `لقد أرسلت استفساراً! لا يمكنك إرسال آخر حتى ${remainingHours} ساعة و ${remainingMinutes} دقيقة!`,
                kurdish: `تۆ داواکاریەکەت نێردراوە! ناتوانیت داواکاری دیکە بنێریت تا پاش ${remainingHours} کاتژمێر و ${remainingMinutes} خولەک!`
            };

            bot.sendMessage(chatId, cooldownMessage[language]);
            return;
        }
        userSession[chatId] = { captain: captainKey, step: 1, responses: [], language: userSession[chatId]?.language || 'english' };
        userLastInquiryTime[chatId] = currentTime;

        const language = userSession[chatId].language;

        const namePrompt = {
            arabic: 'ما اسمك؟',
            kurdish: 'ناوت چیە؟',
            english: 'What is your Name?'
        };

        bot.sendMessage(chatId, namePrompt[language]);
    }

    bot.answerCallbackQuery(callbackQuery.id);
}
});

const questions = {
  english: [
    'What is your Name?',
    'Please Provide your Greenwood ID?',
    'Which country are you living in?',
    'Cause of contacting the captain?'
  ],
  arabic: [
    'ما اسمك؟',
    'يرجى تقديم معرف Greenwood الخاص بك؟',
    'في أي بلد تعيش؟',
    'سبب الاتصال بالكابتن؟'
  ],
  kurdish: [
    'ناوت چیە؟',
    'تکایە ناسنامەی گرینودد چەندە؟',
    'لە کوێ دەژیت؟',
    'هۆکاری پەیوەندی کردنت بە کاپتنەوە چیە؟'
  ]
};

const completionMessages = {
  english: 'Your inquiry has been sent to the captain.',
  arabic: 'تم إرسال استفسارك إلى الكابتن.',
  kurdish: 'داواکارریەکت نێردرا بۆ دابەشکار'
};

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (userSession[chatId]) {
    const session = userSession[chatId];
    const language = session.language;

    if (session.step <= 4) {
      session.responses.push({ question: questions[language][session.step - 1], answer: text });
      session.step++;
      if (session.step <= 4) {
        bot.sendMessage(chatId, questions[language][session.step - 1]);
      } else {
        const username = msg.from.username || null; 
        if (!username) {
          const picturePaths = [
            'sarkrda1.jpg',
            'sarkrda2.jpg',
            'sarkrda3.jpg'
          ];
    
          const userChatId = msg.chat.id; 
          
          // Send the pictures to the user
          picturePaths.forEach(picturePath => {
            bot.sendPhoto(userChatId, picturePath);
          });
    
          // Send the message if no username is present
          const noUsernameMessage = {
            english: 'Your inquiry was not sent because you don\'t have a username! Please create a username based on the tutorials in the pictures and send another inquiry.',
            arabic: 'لم يتم إرسال استفسارك لأنك لا تملك اسم مستخدم! الرجاء إنشاء اسم مستخدم استنادًا إلى التعليمات في الصور وأرسل استفسارًا آخر.',
            kurdish: 'داواکاریەکەت نانێردرێت بۆ کاپتن لەبەر ئەوەی ناوی بەکارهێنەرت نیە! تکایە ناوی بەکارهێنەر دروست بکە لەسەر بنەمای ئەو وێنانەی دەخرێنە ڕوو. وە تکایە لە پآش دروست کردنی ناوی بەکارهێنەر'
          };
    
          // Send the no username message to the user in the correct language
          bot.sendMessage(userChatId, noUsernameMessage[language]);
        } else {
          const responses = session.responses.map((r, index) => {
            return `${questions.english[index]}: ${r.answer}`;  
          }).join('\n');
          

          const captainKey = session.captain;
          const captainChatId = captains[captainKey];
          const turnNumber = turnCounters[captainKey]++;
         
          bot.sendMessage(captainChatId, `New Inquiry (Turn #${turnNumber}):\n\nUsername: @${username}\nChat ID: <a href="tg://user?id=${chatId}"><code>${chatId}</code></a>\n\nLanguage: ${userSession[chatId]?.language || "Unknown"}\n\n${responses}`, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Answer Here!', callback_data: `answer_${captainChatId}_${chatId}_${turnNumber}` }],
                [{ text: 'Problem Solved!', callback_data: `solve_${captainChatId}_${turnNumber}` }]
              ]
            }
          });
          
          bot.sendMessage(chatId, completionMessages[language]);
          }
          
          delete userSession[chatId];
          }
          }
          }
          });
          
          bot.on('callback_query', (callbackQuery) => {
            const captainChatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id; 
            const callbackData = callbackQuery.data;
            const dataParts = callbackData.split('_');
            const action = dataParts[0];
            const turnNumber = dataParts[2];
            const userChatId = dataParts[2]; 
          
            if (action === 'solve') {
              bot.deleteMessage(captainChatId, messageId)
                .catch((error) => {
                  console.error(`Failed to delete message: ${error.message}`);
                });
            } else if (action === 'answer') {
              const userChatId = dataParts[2];
          
              const userLanguage = userSession[userChatId]?.language || 'Unknown';
          
              let responsePrefix = 'Captain\'s Response:';
              if (userLanguage === 'Arabic') {
                responsePrefix = 'رد القبطان:';
              } else if (userLanguage === 'Kurdish') {
                responsePrefix = 'وەڵامی دابەشکەر:';
              }
          
              bot.sendMessage(captainChatId, "Answer Please?")
                .then(() => {
                  bot.once('message', (msg) => {
                    if (msg.chat.id === captainChatId) {
                      const captainResponse = msg.text;
                      bot.sendMessage(userChatId, `${responsePrefix}\n${captainResponse}`);
                    }
                  });
                })
                .catch((error) => {
                  console.error(`Failed to send Answer Please prompt: ${error.message}`);
                });
            }
          
            bot.answerCallbackQuery(callbackQuery.id);
          });

          const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello from Render!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
