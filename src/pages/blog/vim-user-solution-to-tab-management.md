
---

layout: ../../layouts/Layout.astro

title: "A Vim User's Answer to Tab Management Nightmare"

date: 2026-10-18T23:12:00+05:30

description: "Devlog of an extension that solves the tab management nightmare"

image: ../../assets/tabs.jpg

---



[dedupTab](https://github.com/PranavDesai-Git/dedupTab)



## Intro



* You got 50 tabs open. You are researching something.
* You accidentally opened the same link again and spent a few seconds reading it to go, "Oh no, I have read it already" (¬_¬")



I wanted to solve this problem. Pretty simple, I thought: just look for the URL and if it's already there, just switch to the existing tab.



I ended up building a keyboard-driven tree navigation system for browser tabs.



Tho, This project is not one I hand-coded, I wanted to test out the Gemini Flash 3.8 model. Besides, I didn't want to spend more time writing JavaScript.



This is a vibecoded project. Most of the time was spent on ideation and figuring out the UX.



## Duplicate tabs



It was just a background service running that would see a new tab opening, get all the current tabs open, check if it already exists, and then redirect you to that tab with a little notification pill saying "exists already redirecting"



Hmmm... but what if they WANT duplicates... (╭ರ_•́)



> Oh, that's no problem; let's just have them do Alt + middle mouse button if they want a new tab and have it be a duplicate



And then I was thinking. Why would someone even open a new tab?



So they can keep scrolling on their current page and open a bunch of links.



That's how I use it, at least. You go onto Google and middle-click on a bunch of links and queue them up to read them in sequential order.



So I thought it would be neat if you could get back to the tab you came from.



## Jump Back



Wouldn't it be neat to have a lil jump back? So I needed a key combination that felt natural, and it didn't collide with any websites.



`alt + z` was pretty nice. It fits in with the alt + middle mouse we had so far. So I chose that.



And then I added `alt + x`



It was pretty intuitive. You do `alt + z` to go back to where you came from and `alt + x` to go forward.



I realized I would go on little detours when browsing.



Click a link, go to that page, go to a bunch of links on that page, and then come back to the previous page, close all the detour pages, and then read, and then go on a bunch of detours and then come back to the original page.



This happened a lot when I was reading documentation.



## The Tab Tree



And then I realized horizontal tabs are a shit concept.



Like you get 30-ish tabs open and then you have to go visually search for them. It slows you down so much.



In an ideal sane good world we would have vertical tabs. Also, in a sane world, JavaScript wouldn't exist. So we can only dream of good days.



Anyhow. The tabs really should be a tree you can collapse and navigate around. It shouldn't be a little horizontal bar.



Say you are reading an article on Odin on Wikipedia.

You would go into links something like this:



```
odin
├── norse-mythology
│   ├── thor
│   └── freyja
├── german-paganism
│   ├── paganism
│   └── norse-paganism
└── roman-empire
```

So now I wanted to jump to my first child opened and last child cuz I wanna read everything sequentially.

I added two new keybinds.



`alt + g` to go to the first page ever opened and `alt + shift + g` to go to the latest page opened.



* I would open a bunch of links in a new tab.
* Hit `Alt + g` to go to the first one opened, and I would read all of that.
* Hit `Ctrl + W` to close the tab, which would automatically put me in the tab right to it.



There was a problem tho.



Whenever I hit a duplicate tab, it would redirect me to that tab, which was very inconvenient.



So instead of switching to that tab, I just had the duplicate tab be moved up to the top of the child list.



Say you got this open.

```
norse-mythology
├── Thor
├── Mjölnir
└── Freyja
```

And then I open Mjölnir again. Previously, the extension would make me switch tabs to Mjölnir. Now it just moves the existing Mjölnir tab to the end.



```
norse-mythology
├── Thor
├── Freyja
└── Mjölnir
```



Now, a neat thing about this is I could just hit Alt + Shift + G and jump to Mjölnir.



The workflow was great...until it wasn't.



Say you got tabs like this:



```

odin
├── norse-mythology
│   ├── thor
│   └── freyja
└── german-paganism
```



You go to Thor, read that, close the tab; it moves you to Freyja.



You read that, close.. moves you to German paganism...



Now you are in a different child entirely. You could accidentally hit close on German paganism.



And I have done that multiple times where you lose context of what the tree looks like cuz it's in your mind.



To tackle this, I needed a safe way to kill the children (as in the tree node children. Please don't knock on my door, dear FBI agent)



And I wanted a way to tell my detour has ended.



## Killing children Problem



I needed a way to only kill tabs within their own branch. So I added alt + w.



```

odin
├── norse-mythology
│   ├── thor
│   └── freyja
└── german-paganism
```



Say you're at Thor and hit alt + w. It closes the tab and moves you to Freyja. Close that too, and since it's the last child, you get moved back to Norse mythology instead of German paganism.



And get a little notification saying `Detour ended.`



I also added a way to resurrect tabs.



If you kill a tab with children and resurrect it, all its children will spawn back.



## Conclusion



So, the title was a lie... It's not a Vim user's answer to tab management, more like an Emacs user's answer, cuz of the Alt key as a modifier. But saying that would've been a bigger lie cuz I don't use Emacs. And "keyboard-driven computer-usage lunatic's answer to tab management nightmare" is too long.



I would really appreciate modal web browsing tho. I might make a fork of chromiums/thorium which has modal editing built in.



But as it is, the extension is very, very helpful to my current workflow. I already use Alt+0-9 to switch between tabs, and if it gets longer than 10 tabs, then I reevaluate my life. („ᵕᴗᵕ„)



Anyhow, with this tool I can just go on detours, and my tabs will all be organized. I can kill a bunch of detour stuff safely by killing the detour parent.



And yeah...it does a little bit more than dedup tabs.



Check out the repo if you'd like.

[dedupTab](https://github.com/PranavDesai-Git/dedupTab)

