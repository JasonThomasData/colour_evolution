//Keep all variables here, no magic numbers
var environment_settings = {
    env_width_spaces: 12,
    space_width_px: 30,
    env_colour_float: 0.15, //Refer to the colour scale below... this is a yellowish-green
    hatchling_number: 50,
    predator_number: 6,
    hatchling_stroke_colour: 'white',
    predator_stroke_colour: 'black',
    animal_stroke_width: 4,
    animation_duration: 800, //A single moment in animation. There are four of these
    property_inheritance_factor: 0.45, //Two of these for each child
    property_random_factor: 0.1 //A random element from the envrionment
}

var animals_in_env = {
    hatchlings: [],
    predators: [],
    hatchlings_to_be_born: [] //We'll recycle these for reincarnation
}

//A hatchling or predator is born
var animal = function(x, y, colour_float, animal_type) {
    this.animal_type = animal_type;
    this.x_initial = x;
    this.y_initial = y;
    this.x_current = x;
    this.y_current = y;
    this.colour_float = colour_float;
    this.radius = environment_settings.space_width_px / 2.3; //The radius will be smaller than half
    this.animal_shape = null;
}

var colour_scale = d3.scale.linear()
    .domain([0.0, 0.1429, 0.2857, 0.4286, 0.5714, 0.7143, 1.0])
    .range(["red", "orange", "yellow", "green", "blue", "indigo", "violet"]);

//The two here is to give the env a padding of one space around the SVG
d3.select('#visualisation')
    .attr('width', (environment_settings.env_width_spaces + 2) * environment_settings.space_width_px)
    .attr('height', (environment_settings.env_width_spaces + 2) * environment_settings.space_width_px);

//Init the background first, so everything appears on top
var environment_background = d3.select('#visualisation')
    .append('rect')
    .attr('width', environment_settings.env_width_spaces * environment_settings.space_width_px)
    .attr('height', environment_settings.env_width_spaces * environment_settings.space_width_px)
    .attr('x', environment_settings.space_width_px)
    .attr('y', environment_settings.space_width_px)
    .attr('fill', colour_scale(environment_settings.env_colour_float));

function set_env_colour(){
    var select_box = document.getElementById('select_box');
    var selected_value = select_box.options[select_box.selectedIndex].value;
    environment_settings.env_colour_float = +selected_value;
    environment_background
        .attr('fill', colour_scale(environment_settings.env_colour_float));
}
set_env_colour()

select_box.onchange=function(){
    set_env_colour();
};

//This places predators and hatchlings on the env
//cx and cy are plus 1 because the svg has a border all around it.
function draw_animal_shape(x, y, animal_shape, animal_type, colour_float, animal_stroke_colour, animal_radius) {
    animal_shape
        .attr('cx', ((x + 1) * environment_settings.space_width_px) + environment_settings.space_width_px / 2)
        .attr('cy', ((y + 1)* environment_settings.space_width_px) + environment_settings.space_width_px / 2)
        .attr('stroke-width', environment_settings.animal_stroke_width)
        .attr('stroke', animal_stroke_colour)
        .attr('r', 0);

    if (animal_type == 'hatchling'){
        animal_shape
            .attr('fill', colour_scale(colour_float))
    } else {
        animal_shape
            .attr('fill', 'none')
    }

    animal_shape
        .transition()
        .duration(environment_settings.animation_duration)
        .attr('r', animal_radius);
}

//This is recursive, because if the random coords match coords that already exist, it gets called again and returned once
function get_random_coords() {
    var random_x = Math.floor(Math.random() * environment_settings.env_width_spaces);
    var random_y = Math.floor(Math.random() * environment_settings.env_width_spaces);

    for (var k = 0; k < animals_in_env.hatchlings.length; k++){
        if (random_x == animals_in_env.hatchlings[k].x_current && random_y == animals_in_env.hatchlings[k].y_current){
            return get_random_coords();
        }
    }

    return [random_x, random_y];
}

//Initialise the hatchlings
for (var i = 0; i < environment_settings.hatchling_number; i++) {
    var random_coords = get_random_coords();
    var colour_float = Math.random();
    var animal_type = 'hatchling';
    var one_new_hatchling = new animal(random_coords[0],random_coords[1], colour_float, animal_type);
    one_new_hatchling.animal_shape = d3.select('#visualisation').append('circle') //Each element's shape will persist in the env, and the hatchlings will be reincarnated, so we create the shapes here.
    animals_in_env.hatchlings.push(one_new_hatchling);
    animals_in_env.hatchlings_to_be_born.push(one_new_hatchling);
}

//Initialise the predators
//These start at -1, because they do not live on the env, only hatchlings live there
for (var i = 0; i < environment_settings.predator_number; i++) {
    var colour_float = null;
    var animal_type = 'predator';
    var one_new_predator = new animal(i-1,-1, colour_float, animal_type);
    one_new_predator.animal_shape = d3.select('#visualisation').append('circle')

    draw_animal_shape(one_new_predator.x_current, one_new_predator.y_current, 
        one_new_predator.animal_shape, one_new_predator.animal_type, one_new_predator.colour_float, 
        environment_settings.predator_stroke_colour, one_new_predator.radius);

    animals_in_env.predators.push(one_new_predator);
}

//This handles the sorting of hatchlings by how different its colour is from the env
function compare(a,b) {
  if (a.env_colour_difference > b.env_colour_difference)
    return -1;
  if (a.env_colour_difference < b.env_colour_difference)
    return 1;
  return 0;
}

//Extending the array object's propeties
Array.prototype.sample = function () {
    return this[Math.floor(Math.random() * this.length)]
}

//This where a new hatchling inherits its properties
function hatchlings_mate(){
    var parent_1 = animals_in_env.hatchlings.sample();
    var parent_2 = animals_in_env.hatchlings.sample();
    var random_colour = Math.random();

    var hatchling_colour = (parent_1.colour_float * environment_settings.property_inheritance_factor) + 
        (parent_2.colour_float * environment_settings.property_inheritance_factor) + 
        (random_colour * environment_settings.property_random_factor);

    return hatchling_colour;
}

//The main loop. The callback here is * 4, since there are four moments in each loop
setInterval(function() {

    //For each new or reincarnated hatchling, add this to env
    for (var i = 0; i < animals_in_env.hatchlings_to_be_born.length; i++) {
        var this_new_hatchling = animals_in_env.hatchlings[i];
        var animal_type = 'hatchling';
        var random_coords = get_random_coords();
        this_new_hatchling.x_current = random_coords[0];
        this_new_hatchling.y_current = random_coords[1];
        var colour_float = hatchlings_mate();
        this_new_hatchling.colour_float = colour_float;

        draw_animal_shape(this_new_hatchling.x_current, this_new_hatchling.y_current, 
            this_new_hatchling.animal_shape, animal_type, colour_float, 
            environment_settings.hatchling_stroke_colour, this_new_hatchling.radius)

    }
    animals_in_env.hatchlings_to_be_born = [];

    //Order the hatchlings according to most visible [first] to least visible [last]
    for (var i = 0; i < animals_in_env.hatchlings.length; i++) {
        var this_hatchling = animals_in_env.hatchlings[i];
        this_hatchling.env_colour_difference = Math.abs(environment_settings.env_colour_float - this_hatchling.colour_float)
    }
    animals_in_env.hatchlings.sort(compare);

    for (var i = 0; i < animals_in_env.predators.length; i++) {

        //Predator picks up a hatchling
        var random_x = Math.floor(Math.random() * environment_settings.env_width_spaces);
        var random_y = Math.floor(Math.random() * environment_settings.env_width_spaces);
        var this_predator = animals_in_env.predators[i];
        var this_hatchling = animals_in_env.hatchlings[i];
        animals_in_env.hatchlings_to_be_born.push(this_hatchling); //This hatchling we will reincarnate
        this_predator.x_current = this_hatchling.x_current;
        this_predator.y_current = this_hatchling.y_current;
        this_predator.animal_shape
            .transition()
            .delay(environment_settings.animation_duration)
            .duration(environment_settings.animation_duration)
            .attr('cx', ((this_predator.x_current + 1) * environment_settings.space_width_px) + environment_settings.space_width_px / 2)
            .attr('cy', ((this_predator.y_current + 1) * environment_settings.space_width_px) + environment_settings.space_width_px / 2);

        //Move predator back to initial location
        this_predator.x_current = this_predator.x_initial;
        this_predator.y_current = this_predator.y_initial;
        this_predator.animal_shape
            .transition()
            //This part takes 1/4 of the animation
            .delay(environment_settings.animation_duration * 2)
            .duration(environment_settings.animation_duration)
            .attr('cx', ((this_predator.x_current + 1) * environment_settings.space_width_px) + environment_settings.space_width_px / 2)
            .attr('cy', ((this_predator.y_current + 1) * environment_settings.space_width_px) + environment_settings.space_width_px / 2);
        //The hatchling goes with it
        this_hatchling.animal_shape
            .transition()
            //This part takes 1/4 of the animation
            .delay(environment_settings.animation_duration * 2)
            .duration(environment_settings.animation_duration)
            .attr('cx', ((this_predator.x_current + 1) * environment_settings.space_width_px) + environment_settings.space_width_px / 2)
            .attr('cy', ((this_predator.y_current + 1) * environment_settings.space_width_px) + environment_settings.space_width_px / 2);

        //The hatchling disappears
        this_hatchling.animal_shape
            .transition()
            //This part takes 1/4 of the animation
            .delay(environment_settings.animation_duration * 3)
            .duration(environment_settings.animation_duration)
            .attr('r', 0);
    }
}, environment_settings.animation_duration * 4)