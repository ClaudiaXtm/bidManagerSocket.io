const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongo
mongo.connect('mongodb://127.0.0.1/auction_doc', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', function(socket){
        let bid = db.collection('bids');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get bids from mongo collection
        bid.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the new_bids
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let auction_name = data.auction_name;
            let new_bid = data.new_bid;
          //  let auction_time = data.auction_time.getHours()+ ":" + data.auction_time.getMinutes() + ":" + data.auction_time.getSeconds();

            // Check for name and new_bid
            if(auction_name == '' || new_bid == '' ){
                // Send error status
                sendStatus('Please enter a name and new bid');
            }
            else if(isNaN(new_bid)){
              sendStatus('The bid must be numeric!!!');
            }

            else {
                // Insert new_bid
                bid.insert({auction_name: auction_name, new_bid: new_bid}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        new_bid: 'Bid placed',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all bids from collection
            bid.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});
