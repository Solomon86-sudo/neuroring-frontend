"use client";

import { useState, useEffect, useRef } from 'react';
import PushToTalkButton from './components/PushToTalkButton';

const BACKEND_WS_URL = "wss://neuroring-backend.onrender.com"; 

const TOPICS_CATALOG = [
  {
    id: "history", title: "📜 История",
    style: "border-amber-500/30 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40",
    activeStyle: "border-amber-400 bg-amber-500/20 text-amber-200 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    themes: [
      {
        title: "Роль личности в истории: создают ли великие люди эпохи или эпохи создают их?",
        pro: ["Лидеры меняют ход событий силой воли и интеллекта.", "Без конкретных исторических фигур многие реформы и революции не состоялись бы."],
        con: ["Личности — лишь продукт социокультурных и экономических условий своего времени.", "Исторические процессы объективны и развивались бы схожим образом при других лидерах."]
      },
      {
        title: "Была ли неизбежна Первая мировая война или это цепь трагических ошибок?",
        pro: ["Накопившиеся противоречия и гонка вооружений делали конфликт неизбежным.", "Система альянсов создала эффект домино, который нельзя было остановить."],
        con: ["Дипломатические ошибки и амбиции конкретных правителей стали катализатором.", "При более грамотной дипломатии локальный конфликт на Балканах можно было погасить."]
      }
    ]
  },
  {
    id: "philosophy", title: "🧠 Философия",
    style: "border-purple-500/30 text-purple-400 bg-purple-950/20 hover:bg-purple-950/40",
    activeStyle: "border-purple-400 bg-purple-500/20 text-purple-200 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.3)]",
    themes: [
      {
        title: "Существует ли подлинная свобода воли, или каждый наш шаг тотально предопределен?",
        pro: ["Человек осознает выбор и способен действовать вопреки инстинктам.", "Моральная ответственность невозможна без свободы воли."],
        con: ["Наш выбор — результат генетики, воспитания и биохимии мозга.", "Концепция свободы воли — это иллюзия, созданная эволюцией для социализации."]
      },
      {
        title: "Технологический прогресс: величайшее благо для разума или путь к катастрофе?",
        pro: ["Технологии избавляют от болезней, голода и тяжелого труда, продлевая жизнь.", "Они расширяют когнитивные возможности и объединяют человечество."],
        con: ["Прогресс ведет к отчуждению, потере смыслов и разрушению экологии.", "Риски бесконтрольного ИИ и биотехнологий перевешивают потенциальную пользу."]
      }
    ]
  },
  {
    id: "psychology", title: "🔮 Психология",
    style: "border-emerald-500/30 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40",
    activeStyle: "border-emerald-400 bg-emerald-500/20 text-emerald-200 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    themes: [
      {
        title: "Любовь с первого взгляда — это химия мозга или глубокое узнавание?",
        pro: ["Это биологический механизм быстрого поиска подходящего партнера для размножения.", "Ощущение 'узнавания' — это всплеск дофамина и окситоцина."],
        con: ["Это бессознательное совпадение сложных психологических паттернов и травм.", "Химия — лишь следствие глубокого внутреннего резонанса."]
      },
      {
        title: "Социальные сети: инструмент сближения или причина тотального одиночества?",
        pro: ["Стирают границы, позволяя находить единомышленников в любой точке мира.", "Дают голос маргинализованным группам и помогают поддерживать связи."],
        con: ["Создают иллюзию общения, заменяя глубокие связи суррогатами (лайками).", "Стимулируют сравнение себя с нереалистичными образами, повышая тревожность."]
      }
    ]
  },
  {
    id: "cinema", title: "🎬 Кино",
    style: "border-rose-500/30 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40",
    activeStyle: "border-rose-400 bg-rose-500/20 text-rose-200 scale-105 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    themes: [
      {
        title: "Авторское кино против блокбастеров: убьют ли кассовые сборы искусство?",
        pro: ["Студии боятся рисковать, вкладывая деньги только во франшизы и ремейки.", "Сложные, глубокие фильмы вытесняются из кинотеатров аттракционами."],
        con: ["Блокбастеры спонсируют индустрию, позволяя студиям иногда финансировать и артхаус.", "Разделение на жанры существовало всегда, искусство найдет свою нишу на стримингах."]
      },
      {
        title: "Финал истории: делает ли фильм шедевром только открытый финал?",
        pro: ["Открытый финал вовлекает зрителя в сотворчество, заставляя думать после титров.", "Однозначный конец часто обесценивает сложность поднятых в фильме проблем."],
        con: ["Хорошо прописанный, логичный финал требует большего мастерства от сценариста.", "Зритель имеет право на катарсис и завершенность истории, а не на многоточие."]
      }
    ]
  }
];

type GamePhase = 'REGISTRATION' | 'TOPIC_SELECTION' | 'INTRO' | 'PREP_TIME' | 'DEBATE';
type ThemeData = { title: string, pro: string[], con: string[] };

export default function DebateArena() {
  const [phase, setPhase] = useState<GamePhase>('REGISTRATION');
  const [profiles, setProfiles] = useState({
    A: { gender: 'мужчина', age: 30 },
    B: { gender: 'женщина', age: 25 }
  });
  
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeData | null>(null);
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);

  const [moderatorText, setModeratorText] = useState("");
  const [lastTranscript, setLastTranscript] = useState(""); 
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  
  const [isServerConnected, setIsServerConnected] = useState(false);
  const pageSocketRef = useRef<WebSocket | null>(null);
  const audioObjRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrentAudio = () => {
    if (audioObjRef.current) {
      audioObjRef.current.pause();
      audioObjRef.current.currentTime = 0;
      audioObjRef.current = null;
    }
  };

  const playAudioB64 = (base64String: string, onEndCallback?: () => void) => {
    if (!base64String) {
       if (onEndCallback) onEndCallback();
       return;
    }
    try {
      stopCurrentAudio();
      const audio = new Audio(`data:audio/mpeg;base64,${base64String}`);
      audioObjRef.current = audio;
      
      if (onEndCallback) {
          audio.onended = onEndCallback;
      }
      
      audio.play().catch(e => {
          console.error("Автовоспроизведение заблокировано браузером", e);
          if (onEndCallback) onEndCallback();
      });
    } catch (e) { 
        console.error(e); 
        if (onEndCallback) onEndCallback();
    }
  };

  useEffect(() => {
    let socket: WebSocket;
    
    const startConnection = () => {
      console.log("🔌 Подключение к облаку...");
      socket = new WebSocket(`${BACKEND_WS_URL}/ws/debate`);
      pageSocketRef.current = socket;
      
      socket.onopen = () => {
        console.log("✅ Соединение с Render установлено!");
        setIsServerConnected(true);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.text) setModeratorText(data.text);
          if (data.transcript) setLastTranscript(data.transcript);
          if (data.scoreA !== undefined) setScoreA(data.scoreA);
          if (data.scoreB !== undefined) setScoreB(data.scoreB);
          
          if (data.event === "INTRO_COMPLETE") {
             if (data.audio) {
                 playAudioB64(data.audio, () => {
                     setPhase(prev => prev === 'INTRO' ? 'PREP_TIME' : prev);
                 });
             } else {
                 setPhase('PREP_TIME');
             }
          } else if (data.audio) {
             playAudioB64(data.audio);
          }
          
        } catch (e) { console.error(e); }
      };
      
      socket.onclose = () => {
        console.log("❌ Соединение потеряно. Переподключение через 3 секунды...");
        setIsServerConnected(false);
        setTimeout(startConnection, 3000);
      };

      socket.onerror = (err) => {
        socket.close();
      };
    };

    startConnection();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      stopCurrentAudio();
    };
  }, []);

  useEffect(() => {
    let timer: any;
    if (phase === 'PREP_TIME' && prepTimeLeft > 0) {
      timer = setInterval(() => setPrepTimeLeft(prev => prev - 1), 1000);
    } else if (phase === 'PREP_TIME' && prepTimeLeft === 0) {
      setPhase('DEBATE');
      setModeratorText("Время вышло! Микрофоны включены. Начинайте перекрестный допрос!");
    }
    return () => clearInterval(timer);
  }, [phase, prepTimeLeft]);

  const handleServerResponse = (rawData: string) => {
    try {
      const data = JSON.parse(rawData);
      if (data.text) setModeratorText(data.text);
      if (data.transcript) setLastTranscript(data.transcript); 
      if (data.scoreA !== undefined) setScoreA(data.scoreA);
      if (data.scoreB !== undefined) setScoreB(data.scoreB);
      if (data.audio) playAudioB64(data.audio);
    } catch (e) {}
  };

  const submitRegistration = () => setPhase('TOPIC_SELECTION');

  const handleStartGame = () => {
    if (!selectedTheme) return;
    setPhase('INTRO');
    setPrepTimeLeft(60);
    setModeratorText(`📺 Ведущая готовится к эфиру...`);
    
    if (pageSocketRef.current && pageSocketRef.current.readyState === WebSocket.OPEN) {
      // Отправляем на сервер заголовок темы
      const gameConfig = { theme: selectedTheme.title, profiles: profiles };
      pageSocketRef.current.send(`START_GAME:${JSON.stringify(gameConfig)}`);
    } else {
      setModeratorText("⚠️ Ошибка: Нет стабильного подключения к серверу. Подождите пару секунд и попробуйте снова.");
      setTimeout(() => setPhase('TOPIC_SELECTION'), 3000);
    }
  };

  const skipIntro = () => {
    stopCurrentAudio();
    setPhase('PREP_TIME');
  };

  const skipPrep = () => {
    setPrepTimeLeft(0);
    setPhase('DEBATE');
    setModeratorText("Команды готовы досрочно. Микрофоны активны!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 md:p-8 font-sans relative">
      
      {/* ИНДИКАТОР ПОДКЛЮЧЕНИЯ */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5 text-xs text-slate-400 z-50">
        <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        {isServerConnected ? 'Облако: Подключено' : 'Облако: Поиск сети...'}
      </div>

      {/* ТАБЛО СЧЕТА */}
      <div className={`w-full max-w-5xl flex justify-between items-center mb-4 mt-8 transition-all ${phase === 'DEBATE' ? 'opacity-100' : 'opacity-20'}`}>
        <div className="text-2xl md:text-4xl font-black text-cyan-400">КОМАНДА А: {scoreA}</div>
        <div className="text-2xl md:text-4xl font-black text-fuchsia-500 text-right">КОМАНДА Б: {scoreB}</div>
      </div>

      <div className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center border border-white/10 rounded-[30px] bg-slate-900/50 backdrop-blur-xl p-6 md:p-12 text-center shadow-2xl relative min-h-[400px] my-4">
        
        {/* ФАЗА: РЕГИСТРАЦИЯ */}
        {phase === 'REGISTRATION' && (
          <div className="w-full flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-black mb-8 text-white uppercase tracking-wider">Регистрация участников</h2>
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl">
              <div className="flex-1 p-6 border border-cyan-500/30 bg-cyan-950/20 rounded-2xl">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Команда А (ЗА)</h3>
                <div className="flex flex-col gap-4">
                  <label className="text-left text-sm text-cyan-200">Пол спикера:
                    <select value={profiles.A.gender} onChange={e => setProfiles({...profiles, A: {...profiles.A, gender: e.target.value}})} className="w-full mt-1 bg-slate-900 border border-cyan-500/50 rounded-lg p-3 text-white outline-none">
                      <option value="мужчина">Мужчина</option>
                      <option value="женщина">Женщина</option>
                    </select>
                  </label>
                  <label className="text-left text-sm text-cyan-200">Возраст:
                    <input type="number" min="10" max="99" value={profiles.A.age} onChange={e => setProfiles({...profiles, A: {...profiles.A, age: Number(e.target.value)}})} className="w-full mt-1 bg-slate-900 border border-cyan-500/50 rounded-lg p-3 text-white outline-none" />
                  </label>
                </div>
              </div>

              <div className="flex-1 p-6 border border-fuchsia-500/30 bg-fuchsia-950/20 rounded-2xl">
                <h3 className="text-xl font-bold text-fuchsia-400 mb-4">Команда Б (ПРОТИВ)</h3>
                <div className="flex flex-col gap-4">
                  <label className="text-left text-sm text-fuchsia-200">Пол спикера:
                    <select value={profiles.B.gender} onChange={e => setProfiles({...profiles, B: {...profiles.B, gender: e.target.value}})} className="w-full mt-1 bg-slate-900 border border-fuchsia-500/50 rounded-lg p-3 text-white outline-none">
                      <option value="мужчина">Мужчина</option>
                      <option value="женщина">Женщина</option>
                    </select>
                  </label>
                  <label className="text-left text-sm text-fuchsia-200">Возраст:
                    <input type="number" min="10" max="99" value={profiles.B.age} onChange={e => setProfiles({...profiles, B: {...profiles.B, age: Number(e.target.value)}})} className="w-full mt-1 bg-slate-900 border border-fuchsia-500/50 rounded-lg p-3 text-white outline-none" />
                  </label>
                </div>
              </div>
            </div>
            <button onClick={submitRegistration} className="mt-8 px-12 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-all shadow-xl uppercase">Перейти к выбору темы ➔</button>
          </div>
        )}

        {/* ФАЗА: ВЫБОР ТЕМЫ */}
        {phase === 'TOPIC_SELECTION' && (
          <div className="w-full flex flex-col items-center">
             <h2 className="text-2xl md:text-3xl font-black mb-8 bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent uppercase tracking-wider">Выбор дисциплины баттла</h2>
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              {TOPICS_CATALOG.map((cat) => (
                <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setSelectedTheme(null); }} className={`p-4 border rounded-2xl transition-all text-base font-bold ${activeCategoryId === cat.id ? cat.activeStyle : `${cat.style} opacity-70 hover:opacity-100`}`}>{cat.title}</button>
              ))}
            </div>
            {activeCategoryId && (
              <div className="w-full flex flex-col gap-3 mb-8 text-left">
                {TOPICS_CATALOG.find(c => c.id === activeCategoryId)?.themes.map((themeObj, i) => (
                  <button key={i} onClick={() => setSelectedTheme(themeObj)} className={`p-4 rounded-xl border transition-all ${selectedTheme?.title === themeObj.title ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200 font-medium' : 'border-white/5 bg-slate-900/40 text-slate-300'}`}>{themeObj.title}</button>
                ))}
              </div>
            )}
            {selectedTheme && <button onClick={handleStartGame} className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-black rounded-full hover:scale-105 transition-all uppercase">Выйти на ринг 🎬</button>}
          </div>
        )}

        {/* ФАЗА: ВСТУПЛЕНИЕ */}
        {phase === 'INTRO' && (
          <div className="w-full flex flex-col items-center justify-center animate-pulse">
            <h2 className="text-4xl font-black text-white mb-4">В эфире...</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl">{moderatorText}</p>
            <button onClick={skipIntro} className="px-6 py-2 border border-white/20 text-white/50 rounded-full hover:text-white hover:border-white transition-all text-sm">
              Пропустить вступление ➔
            </button>
          </div>
        )}

        {/* ФАЗА: ПОДГОТОВКА (ОТКРЫТЫЕ ТЕЗИСЫ И ТАЙМЕР) */}
        {phase === 'PREP_TIME' && (
          <div className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-4 uppercase tracking-widest">Минута на подготовку</h2>
            
            <div className="text-6xl md:text-8xl font-mono font-black text-white mb-6 bg-slate-950 px-8 py-4 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              00:{prepTimeLeft.toString().padStart(2, '0')}
            </div>
            
            {selectedTheme && (
              <div className="flex flex-col items-center w-full max-w-4xl mb-8">
                 {/* Визуал темы - выделенный блок с названием */}
                 <div className="text-center mb-6 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl w-full shadow-inner">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block mb-2">Текущая тема:</span>
                    <h3 className="text-xl md:text-2xl font-bold text-white">{selectedTheme.title}</h3>
                 </div>
                 
                 <div className="flex flex-col md:flex-row gap-6 w-full text-left">
                    {/* Тезисы Команды А */}
                    <div className="flex-1 bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl">
                      <h4 className="text-cyan-400 font-bold mb-3 border-b border-cyan-500/30 pb-2">Шпаргалка Команды А (ЗА):</h4>
                      <ul className="list-disc list-inside text-sm text-cyan-50 space-y-3">
                        {selectedTheme.pro.map((point, i) => <li key={i}>{point}</li>)}
                      </ul>
                    </div>
                    
                    {/* Тезисы Команды Б */}
                    <div className="flex-1 bg-fuchsia-950/20 border border-fuchsia-500/30 p-4 rounded-xl">
                      <h4 className="text-fuchsia-400 font-bold mb-3 border-b border-fuchsia-500/30 pb-2">Шпаргалка Команды Б (ПРОТИВ):</h4>
                      <ul className="list-disc list-inside text-sm text-fuchsia-50 space-y-3">
                        {selectedTheme.con.map((point, i) => <li key={i}>{point}</li>)}
                      </ul>
                    </div>
                 </div>
              </div>
            )}

            <button onClick={skipPrep} className="px-8 py-3 border border-white/20 text-white/50 rounded-full hover:text-white hover:border-white transition-all">
               К дебатам (Команды готовы) ➔
            </button>
          </div>
        )}

        {/* ФАЗА: ДЕБАТЫ */}
        {phase === 'DEBATE' && (
          <div className="w-full flex flex-col items-center">
            <h2 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-[0.3em]">Открытый микрофон: {selectedTheme?.title}</h2>
            {lastTranscript && (
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl max-w-2xl text-center">
                <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest block mb-1">Услышано:</span>
                <p className="text-lg italic text-cyan-50">"{lastTranscript}"</p>
              </div>
            )}
            <p className="text-xl md:text-2xl font-light leading-relaxed text-white max-w-3xl whitespace-pre-line">{moderatorText}</p>
          </div>
        )}
      </div>

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div className={`w-full max-w-5xl flex flex-col sm:flex-row gap-4 md:gap-8 mb-2 transition-all ${phase === 'DEBATE' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-20 filter grayscale'}`}>
          <PushToTalkButton teamName="Команда А (ГОВОРИТЬ)" colorClass="bg-cyan-600" onResponse={handleServerResponse} socketRef={pageSocketRef} />
          <PushToTalkButton teamName="Команда Б (ГОВОРИТЬ)" colorClass="bg-fuchsia-600" onResponse={handleServerResponse} socketRef={pageSocketRef} />
      </div>

    </div>
  );
}