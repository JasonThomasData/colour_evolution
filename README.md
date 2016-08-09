###A simplistic example of evolution

Here we have an environment that I've created where virtual animals reproduce, passing their attributes on to their offspring, while the population is thinned out by predators.

I don't claim to have a working example of evolution and all of its complexities.

This example only exhibits one aspect of evolution - that a species will bear characteristics of animals that live long enough to reproduce.

###Technology used with this project

This project was made using Sublime Text, an Ubuntu 14.04 laptop and an Apache2 local server environment.

This project uses d3.js to draw SVG elements and handle the colour scale.

These circular animals/hatchlings will each have a colour_float property, which can be passed into d3.scale.linear() to return an RGB colour.

The predators in this visualisation will select the hatchlings that have the highest absolute difference from the environment's floating point value.

To avoid adding and removing lots of different DOM elements, I've created all the elements on initialisation. The caught hatchlings will have the appearance of dissapearing. Those elements will be placed back on the board, rather than having to create new ones, I've just reincarnated those hatchling shapes. 