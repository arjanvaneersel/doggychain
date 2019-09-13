const contractAddress ='ct_CifXCdYwZnmsN2eCbvyBZEqNJ2ifyeNbVe2HKLgfGry4Jp1eJ';
var client = null;
var dogArray = [];
var dogsLength = 0;

function renderDogs() {
  dogArray = dogArray.sort(function(a,b){return b.votes-a.votes})
  var template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {dogArray});
  $('#dogBody').html(rendered);
}

async function callStatic(func, args, types) {
  const calledGet = await client.contractCallStatic(contractAddress,
  'sophia-address', func, {args}).catch(e => console.error(e));

  console.log(calledGet);

  const decodedGet = await client.contractDecodeData(types,
  calledGet.result.returnValue).catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value, types) {
  const calledSet = await client.contractCall(contractAddress, 'sophia-address',
  contractAddress, func, {args, options: {amount:value}}).catch(async e => {
    const decodedError = await client.contractDecodeData(types,
    e.returnValue).catch(e => console.error(e));
  });

  return
}


window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();

  const resp = await callStatic('myDogs','()','int');
  myDogs = resp.value;

  for (dog of myDogs) {
    console.log(dog);
    // dogArray.push({
    //   chip_id: dog[1].value
    //   owner: dog[3].value,
    //   name: dog.value[2].value,
    //   breed: dog[0].value,
    //   photo_url: dog.value[4].value,
    // })
  }

  renderdogs();

  $("#loader").hide();
});

// jQuery("#dogBody").on("click", ".voteBtn", async function(event){
//   $("#loader").show();

//   const value = $(this).siblings('input').val();
//   const dataIndex = event.target.id;

//   await contractCall('votedog',`(${dataIndex})`,value,'(int)');

//   const foundIndex = dogArray.findIndex(dog => dog.index == dataIndex);
//   dogArray[foundIndex].votes += parseInt(value, 10);

//   renderdogs();

//   $("#loader").hide();
// });

$('#registerBtn').click(async function(){
  $("#loader").show();

  const chip_id = ($('#regID').val()),
        name = ($('#regName').val()),
        breed = ($('#regBreed').val()),
        photo_url = ($('#regURL').val());

  await contractCall('registerDog',`("${chipID}","${name}", "${breed}, "${photo_url}")`,0,'(int)');

  dogArray.push({
    chip_id: chip_id,
    name: name,
    breed: breed,
    photo_url: url,
  })

  renderdogs();

  $("#loader").hide();
});
