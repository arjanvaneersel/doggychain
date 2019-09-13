const contractSource = `
  contract DoggyChain =

  record dog =
    { chip_id: string,
      owner: address,
      name: string,
      breed: string,
      photo_url: string, 
      missing: bool }

  record state =
    { dogs      : map(string, dog) }

  entrypoint init() =
    { dogs = {} }
    
  private function myDogs'(all' : list((string, dog)), dest' : list(dog), key' : address) : list(dog) =
    switch(all')
      [] => dest'
      (_, dog)::tl =>
        if (dog.owner == key') myDogs'(tl, dog :: dest', key')
        else myDogs'(tl, dest', key')

  entrypoint myDogs() : list(dog) =
    myDogs'(Map.to_list(state.dogs), [], Call.caller)
    
  private function missingDogs'(all' : list((string, dog)), dest' : list(dog)) : list(dog) =
    switch(all')
      [] => dest'
      (_, dog)::tl =>
        if (dog.missing) missingDogs'(tl, dog :: dest')
        else missingDogs'(tl, dest')
        
  entrypoint missingDogs() : list(dog) = 
    missingDogs'(Map.to_list(state.dogs), [])

  entrypoint getDog(chip_id' : string) : dog =
    switch(Map.lookup(chip_id', state.dogs))
      None    => abort("There is no dog with this chip ID registered.")
      Some(x) => x

  stateful entrypoint registerDog(chip_id': string, name': string, breed': string, photo_url': string, missing': bool) =
    if(Map.member(chip_id', state.dogs))
      abort("This dog is already registered")

    let dog = { owner = Call.caller, chip_id = chip_id', name = name', breed = breed', photo_url = photo_url', missing = missing' }
    put(state{ dogs[chip_id'] = dog })
`;

const contractAddress = 'ct_2MJqPZtai8coKmyo9ZnjCGUu9RREUHkFssuTFgmHuUXCcbWDSt';
//Create variable for client so it can be used in different functions
var client = null;
//Create a new global array for the dogs
var dogArray = [];
//Create a new variable to store the length of the dog globally
var dogsLength = 0;

function renderdogs() {
  //Order the dogs array so that the dog with the most votes is on top
  //dogArray = dogArray.sort(function(a,b){return b.votes-a.votes})
  
  //Get the template we created in a block scoped variable
  let template = $('#template').html();
  //Use mustache parse function to speeds up on future uses
  Mustache.parse(template);
  //Create variable with result of render func form template and data
  let rendered = Mustache.render(template, {dogArray});
  //Use jquery to add the result of the rendering to our html
  $('#dogBody').html(rendered);
}

//Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
  //Create a new contract instance that we can interact with
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to get data of smart contract func, with specefied arguments
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
  //Make another call to decode the data received in first call
  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

//Create a asynchronous write call for our smart contract
async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {amount: value}).catch(e => console.error(e));

  return calledSet;
}

//Execute main function
window.addEventListener('load', async () => {
  //Display the loader animation so the user knows that something is happening
  $("#loader").show();

  //Initialize the Aepp object through aepp-sdk.browser.js, the base app needs to be running.
  client = await Ae.Aepp();

  //First make a call to get to know how may dogs have been created and need to be displayed
  //Assign the value of dog length to the global variable
  dogs = await callStatic('missingDogs', []);

  //Loop over every dog to get all their relevant information
  for (dog in dogs) {
    console.log(dog);

    //Make the call to the blockchain to get all relevant information on the dog
    //const dog = await callStatic('getdog', [i]);

    //Create dog object with  info from the call and push into the array with all dogs
    dogArray.push({
      chip_id: dog.chip_id,
      owner: dog.owner,
      name: dog.name,
      breed: dog.breed,
      photo_url: dog.photo_url,
      missing: dog.missing,
    })
  }

  //Display updated dogs
  renderdogs();

  //Hide loader animation
  $("#loader").hide();
});

//If someone clicks to vote on a dog, get the input and execute the voteCall
// jQuery("#dogBody").on("click", ".voteBtn", async function(event){
//   $("#loader").show();
//   //Create two new let block scoped variables, value for the vote input and
//   //index to get the index of the dog on which the user wants to vote
//   let value = $(this).siblings('input').val(),
//       index = event.target.id;

//   //Promise to execute execute call for the vote dog function with let values
//   await contractCall('votedog', [index], value);

//   //Hide the loading animation after async calls return a value
//   const foundIndex = dogArray.findIndex(dog => dog.index == event.target.id);
//   //console.log(foundIndex);
//   dogArray[foundIndex].votes += parseInt(value, 10);

//   renderdogs();
//   $("#loader").hide();
// });

//If someone clicks to register a dog, get the input and execute the registerCall
$('#registerBtn').click(async function(){
  $("#loader").show();
  //Create two new let variables which get the values from the input fields
  const chip_id = ($('#regChipID').val()),
        name = ($('#regName').val()),
        breed = ($('#regBreed').val()),
        photo_url = ($('#regPhotoURL').val());

  let args = [chip_id, name, breed, photo_url];
  console.log(args)
  //Make the contract call to register the dog with the newly passed values
  await contractCall('registerDog', args, 0);

  //Add the new created dogobject to our dogarray
  dogArray.push({
    chip_id: chip_id,
    //owner: dog.owner,
    name: name,
    breed: breed,
    photo_url: photo_url,
  })

  renderdogs();
  $("#loader").hide();
});
