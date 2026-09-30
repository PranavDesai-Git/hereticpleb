---
layout: ../../layouts/Layout.astro
title: "LinkedIn Larpmaxxing"
date: 2026-09-28T23:12:00+05:30
description: "rant and building of the slop YOLO project to detect other slop YOLO projects"

---



LinkedIn is a soul-sucking hole of professionalism and a pit of hell that not even my worst enemy should spend the rest of his days in.



It's this concoction of performative productivity and corpo speak producing cursed artifacts beyond human comprehension.



A place where normal human text goes to die and can only be kept alive by an LLM like a radiation protection suit.



And I wanted to look into the performative projects people keep making that are all over my feed.



## The Feed



It is legit the most unbearable stuff you would see.



> My third cousin got hit by a truck🚚💥 today! Here's what it taught me about business management👇



And everyone carries this fake tone of being "visionary" and "forward-thinking" and "professional"



It's SO tiring.



## The Projects



And then you look at the projects they are posting.



Genuinely, every time I open LinkedIn, I get hit by these Computer Vision Projects of some guy waving his hand around, and it tracks them.



Like, I wouldn't mind if it was one of these, but it is legit all I see. It is just every other post some guy waving his hand around doing NONSENSE.



It's not even useful. It's not even something anyone would like using. It's just "look at me computer vision"



I am pretty sure they either vibecode it or get it from a tutorial. cuz EVERY SINGLE ONE IS THE SAME.



![pointing finger game thingy](../../assets/pointing_finger_thingy.png)





Btw, you wanna know how bad it is? This image I put? I didn't even go digging for it. I literally just opened LinkedIn, and this was the first thing I saw...and the second...and the third...and the fourth...and the fifth...



![pothole slop](../../assets/pothole.png)



I am not kidding; this was the second thing I saw just now.



Also, the thing that gets me is that the first image is at least a game, not a good one, sure, but it is something. But this pothole detection. What is the point? You know what else could detect potholes? Eyes. They are very, very good at detecting those.





They are not sending it to anything. Like, if it was connected to all car cameras for detection, well, first, mass surveillance, and also if you have so many potholes you can't keep track of them and need crowd-sourced data for potholes, you have WAYYY bigger issues, but sure. If it was sending the api somewhere, that would be cute. BUT IT'S NOT.



> The bigger idea is to use AI for smart infrastructure monitoring, where road conditions can be assessed more efficiently, and maintenance teams can make better data-driven decisions.

This project also showed me that real-world computer vision is not just about detecting objects; lighting, road conditions, camera angles, and overlapping detections can all affect performance.



I am so tired of seeing these.



How difficult is it to produce one of these projects that looks impressive on LinkedIn?

(spoiler. pretty easy.)



## Making the YOLO Post Detector



I decided to make a detector for the "🚀 Excited to announce I made a YOLO project" posts.

I am learning this from scratch; I've never done this before. I just wanna see how hard it could be. Can't critique cooking without ever cooking ramen.

It won't be useful, but now you will know slop is in fact slop.



It took me an hour and a half to learn and make the whole thing, and most of it was just drawing boxes and waiting for the model to be trained.



Okay, so the first part of making this is data. You need to train your model on some data that show the model what one of these posts looks like.



I wrote this script to collect the images. It scrolls through my feed and takes screenshots:



```bash

mkdir -p raw_data

sleep 5 # to switch to browser

for i in {1..200}; do

scrot "raw_data/slop_$(printf "%03d" $i).png"

xdotool key Page_Down

sleep 3

done

```



My script has collected 200 images, which should be good enough for now.



Now I created a Roboflow account, created my project, and uploaded my screenshots.



I just had to scroll through the screenshots and annotate them by drawing a box around the things I think need to be detected. It was pretty mechanical. Took about 20 minutes.



Once the images were annotated, I just exported them in the YOLOv8 format and downloaded the zip file of my dataset.



Now it was time to train the model. And that can be done with basically no effort.



```python
from ultralytics import YOLO

model = YOLO('yolov8n.pt')

results = model.train(
  data='dataset/data.yaml',
  epochs=50,
  imgsz=320,
  name='slop_detector'
)
```



great! Just wait for the training to finish. It took me 30 mins cuz I have a potato pc.



Once the training finished, I wrote the Python script to run the model.



```python
from ultralytics import YOLO
import sys

def main(image_path):
    model = YOLO('runs/detect/slop_detector/weights/best.pt')
    model(image_path, save=True, conf=0.10)

main(sys.argv[1])
```



YAYYY I got my very own slop detector!!!





<iframe width="100%" height="315" src="https://www.youtube.com/embed/ywJ8i61Z9Uo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>





I think I can finally add computer vision expert, Python savant, and AI and ML thought leader to my resume.



![adding heading](../../assets/addingheading.png)



## Conclusion



Yeah, it took me an hour and a half to learn and build the whole thing. It'd be more interesting if they were optimizing the models or pushing the accuracy or whatever, but most of what you see on LinkedIn is just this: pretty trivial stuff with cool marketing on top.



And nobody says anything because your comments show up on your profile. If a recruiter scrolls through and sees you calling slop slop, you're the asshole. So everyone claps and moves on.



That's the real problem. Nothing on that site rewards you for getting better. It's a platform built around selling yourself for a job, so what survives isn't skill; it's looking interesting. It's just LARPing productivity. Go to some of these profiles, and it's the same guy detecting potholes over and over and over with zero signs of improvement.
