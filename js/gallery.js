"use strict";
/* ============ Gallery (slideshow) ============
   PHOTOS is the site's shared photo library: the slideshow plays through
   it in order, and The Sliding Memory picks a random entry for each
   puzzle. To add your own photos: drop image files into images/gallery/
   and add an entry here — src is the file path, title the heading,
   note the caption shown underneath.                                  */

const PHOTOS = [

  {
    src: "images/gallery/first\ photo.jpeg",
    title: "First ever photo together",
    note: "I believe this was only the second or third time we ever met, but the first time that we had a proper conversation. You were such an entertaining person to talk to, and I immediately wanted to get to know you better. I'm glad I did, and I'm glad you invited me into the photo."
  },
  {
    src: "images/gallery/first\ duo\ pic.jpeg",
    title: "First pic together",
    note: "Such a fire photo, I'm glad I didn't turn out to be the only person who showed up with sunglasses. Our hairstyles perfectly complement one another too no? This will forever be your call poster, it'll be hard to top this."
  },
  {
    src: "images/gallery/first\ drink.JPG",
    title: "The story of BollyWood Ball",
    note: "Though the event as a whole turned out to be somewhat of a fiasco, this was still our first event after becoming friends. I had a lot of fun waiting in line to get into the event, seeing you down that fireball was hilarous",
  },
  {
    src: "images/gallery/don.JPG",
    title: "Tearing it up",
    note: "What a concert, surely it gaps the one in climate pledge. I had a lot of fun with your gang, I think I need to meet Anchit at least one more time in my life, he was a super chill.",
  },
  {
    src: "images/gallery/peak\ date.jpeg",
    title: "Gardens O' Gold",
    note: "I finally got the privilege to go on a date with this girl of my dreams. This date really had it all: a beatiful view, an even prettier lady next to me, and a long walk",
  },
  {
    src: "images/gallery/csball.jpeg",
    title: "Into the Light",
    note: "I look like a chopped uncle here, especially with a fork still in my hands, but alas this is important. This was right after you kissed my cheek in front of Aryan and Sagunya at the CSE ball, very cheeky of you. We capped off this stunning reveal with this marvlous shot!",
  },
  {
    src: "images/gallery/waterfront.jpeg",
    title: "Waterfront",
    note: "Still very early on in our relationship, we decided to revisit the scene of the crime. I was quite lost in your world and failed to notice our own little audience",
  },
  {
    src: "images/gallery/honeymoon\ phase\ eh.JPG",
    title: "Rager",
    note: "I look at this photo very often. How I got so lucky to get someone as smart and gorgeous as you in a photo with me a question I still struggle to answer. \n (p.s. still can't belive Pari made an appearance this night)",
  },
  {
    src: "images/gallery/5k.jpg",
    title: "Just Keep Running",
    note: "This was the first time we did something difficult together, which is quite the step. I was very suprised that we finished together, I was very worried that I was that I was going to get dusted from the start. Just remember that I did NOT let you win, I have to much of an ego to be doing all that.",
  },
  {
    src: "images/gallery/otw\ to\ parking\ lot.JPG",
    title: "Parking Lot",
    note: "These trips were the pinnacle of each day for me. I attribute a lot of how we got to know each other to the daily walk to the parking lot and our hanging out in the car. Every day I would look forward to it before we went, and miss it after you left.",
  },
  {
    src: "images/gallery/studious.jpeg",
    title: "Studious",
    note: "Back when we were able to attend each other's presentations... I'm so proud of how hard you've worked to achieve all that you have. I can't wait to flex that I knew a Nobel laureate when they were but a wee undergraduate researcher.",
  },
  {
    src: "images/gallery/you\ like\ jazz.JPEG",
    title: "Ya Like Jazz?",
    note: "Somehow it'd only been 6 months. I'd imagine you disagree, but I consider this to rank in the top 3 of our all time dates. We got to LARP as old souls, and I can't wait to grow old with you and be dancing to Maroon 5 in the 2070s",
  },
  {
    src: "images/gallery/enchanted.jpeg",
    title: "Utterly Enchanted",
    note: "Second difficult thing we ever did together. This was so beautiful you'll have my eternal gratitude for inviting me along. Somehow the core was only the second most stunning thing during the hike...",
  },
  {
    src: "images/gallery/solo\ fatass\ journey.jpg",
    title: "Eats and Talks",
    note: "I'm lucky to have such a funny and entertaining girlfriend, this date randomly turned out to be such a blast. She's so thoughtful she even let me have the entire donut to myself!",
  },
  {
    src: "images/gallery/SLU\ summer.jpeg",
    title: "SLU summer",
    note: "I'm still amazed at how our offices for the summer ended up being RIGHT next to each other. Nothing could match how excited I would get after finishing my work, knowing that in 5 minutes I would see your radiant smile in the UW med courtyard. We sure terrorized the poor pedestrians with us thinking these windows were opaque.",
  },
  {
    src: "images/gallery/roped.png",
    title: "Mind Challenge",
    note: "You seem to have enjoyed this a little too much",
  },
  {
    src: "images/gallery/nightOne.JPG",
    title: "Night One (two)",
    note: "This was our second-ever sleepover. Say goodbye to the daily walks and tearful farewells of the previous year. I could see you in the night, dream about you, and then see you again in the morning. What a treat!",
  },
  {
    src: "images/gallery/crishtmas.jpg",
    title: "Christmas",
    note: "This dress was stunning. Also featuring the green shirt you picked out (where would I be without it?). With this, we wrapped up the year 2025",
  },
  {
    src: "images/gallery/oneyear.JPEG",
    title: "One year anniversary",
    note: "I'm so grateful that you still liked to hang around me after a year of dating. (It would have been a little awkard to celebrate 18 months without having dated 12 first). I fall deeper and deeper in love with you every day",
  },
  {
    src: "images/gallery/bday.jpg",
    title: "Sahana turns 19!",
    note: "My princess turns 19! Another one of my favorite pictures. You put together such a well-planned and executed event, I don't know how you do it. I'll be forever in your debt for the pink glasses you graciously donated for me to fit with the theme. Maybe its time to invest in a pink shirt.",
  },
  {
    src: "images/gallery/jammies.jpeg",
    title: "Matching matching",
    note: "First matching clothes photo. Many thanks to your mother for sponsoring this lovely nighttime outfit, I think it really brings out the black in my hair.",
  },
  {
    src: "images/gallery/meet\ the\ fam.JPG",
    title: "Meet the Subramanians",
    note: "I was very pleasantly surprised when you told me I was invited to play pickleball with you and your family. I love your parents! We need to give racket sports a try again, we seemed to be quite successfull when we were paired up during this.",
  },
  {
    src: "images/gallery/meet\ the\ fam\ p2.jpg",
    title: "Meet the Jains",
    note: "Thank you for coming and meeting my parents, they absolutely adore you. They can't get enough of hearing about what you're up to. Also, I'm 90% sure they like you more than they like me. They're also in disbelief that such a smart, well-spoken, and pretty girl is dating their son (their words not mine).",
  },
  {
    src: "images/gallery/grad.JPG",
    title: "Graduation",
    note: "Congrats on graduating, I'm so proud of you! You'll go on to do great things, without a shadow of a doubt. Its been a privilege to be able to grow alongside you, and I'm excited to see what inspiring journey you undertake next.",
  },
  {
    src: "images/gallery/end\ of\ szn1.jpeg",
    title: "Start of a new Era",
    note: "I'm so lucky to have met you and to have been able to keep you in my life. I've loved every second of the time I spent with you in Seattle, and while I don't know where our futures will take us, I can say with confidence that I'll at least be with you. I miss you dearly, and can't wait to see you again soon. I love you, Sahana",
  },







];

/* seconds each photo stays on screen before the slideshow moves on */
const SLIDE_SECONDS = 10;

if (typeof document !== "undefined" && document.getElementById("slideshow")){
  const root = document.getElementById("slideshow");
  const img = document.getElementById("ssImg");
  const bar = document.getElementById("ssBar");
  const titleEl = document.getElementById("ssTitle");
  const noteEl = document.getElementById("ssNote");
  const dotsWrap = document.getElementById("ssDots");
  const prevBtn = document.getElementById("ssPrev");
  const nextBtn = document.getElementById("ssNext");
  const pauseBtn = document.getElementById("ssPause");

  let cur = 0, timer = null, paused = false;

  const dots = PHOTOS.map((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "ss-dot";
    d.setAttribute("aria-label", "photo " + (i + 1));
    d.addEventListener("click", () => go(i, true));
    dotsWrap.appendChild(d);
    return d;
  });

  function show(){
    const p = PHOTOS[cur];
    img.classList.add("fading");
    img.onload = () => img.classList.remove("fading");
    setTimeout(() => {
      img.src = p.src;
      img.alt = p.title;
      titleEl.textContent = p.title;
      noteEl.textContent = p.note;
      setTimeout(() => img.classList.remove("fading"), 400); // safety for cached loads
    }, 180);
    dots.forEach((d, i) => d.classList.toggle("on", i === cur));
    restartBar();
    if (PHOTOS.length > 1) new Image().src = PHOTOS[(cur + 1) % PHOTOS.length].src; // preload next
  }

  /* Restart the little countdown bar. The longhands matter: an inline
     `animation:` shorthand would also pin play-state to running, which
     would break the paused state set from the stylesheet. */
  function restartBar(){
    bar.style.animation = "none";
    void bar.offsetWidth; // force reflow so the animation starts over
    bar.style.animation = "";
    bar.style.animationName = "ss-fill";
    bar.style.animationDuration = SLIDE_SECONDS + "s";
    bar.style.animationTimingFunction = "linear";
    bar.style.animationFillMode = "forwards";
  }

  function resetTimer(){
    clearInterval(timer);
    timer = null;
    if (!paused && PHOTOS.length > 1)
      timer = setInterval(() => go(cur + 1, false), SLIDE_SECONDS * 1000);
  }

  function go(i, manual){
    cur = (i + PHOTOS.length) % PHOTOS.length;
    show();
    if (manual) resetTimer(); // a manual flip earns the photo its full stay
  }

  function togglePause(){
    paused = !paused;
    root.classList.toggle("paused", paused);
    pauseBtn.textContent = paused ? "▶ Play" : "⏸ Pause";
    pauseBtn.setAttribute("aria-pressed", String(paused));
    if (paused){
      clearInterval(timer);
      timer = null;
    } else {
      restartBar();
      resetTimer();
    }
  }

  prevBtn.addEventListener("click", () => go(cur - 1, true));
  nextBtn.addEventListener("click", () => go(cur + 1, true));
  pauseBtn.addEventListener("click", togglePause);
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") go(cur - 1, true);
    else if (e.key === "ArrowRight") go(cur + 1, true);
  });

  if (PHOTOS.length < 2){
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    pauseBtn.style.display = "none";
    dotsWrap.style.display = "none";
  }

  show();
  resetTimer();
}
