import express from 'express';
import bodyParser from 'body-parser';
import { HttpProvider } from '@0xcert/wanchain-http-provider';
import { AssetLedger, GeneralAssetLedgerAbility } from '@0xcert/wanchain-asset-ledger';
import { OrderGateway, OrderActionKind, Order } from '@0xcert/wanchain-order-gateway';

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const port = 8080;
const provider = new HttpProvider({
    url: 'http://127.0.0.1:8545',
    accountId: '0xe96D860C8BBB30F6831E6E65d327295B7A0C524f', // replace with your account.
    requiredConfirmations: 1
});

// Create new asset ledger
app.post('/deploy', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    const mutation = await AssetLedger.deploy(provider, {
        name: req.body.name,
        symbol: req.body.symbol,
        uriBase: req.body.uriBase,
        schemaId: req.body.schemaId,
        capabilities: req.body.capabilities
    });
    res.send(mutation.id);
});

// Create new asset
app.post('/mint', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.body.assetLedgerId);
    
    const mutation = await ledger.createAsset({
        receiverId: req.body.receiverId,
        id: req.body.id,
        imprint: req.body.imprint
    });
    res.send(mutation.id);
});

// Transfer asset
app.post('/transfer', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.body.assetLedgerId);
    
    const mutation = await ledger.transferAsset({
        receiverId: req.body.receiverId,
        id: req.body.id,
    });
    res.send(mutation.id);
});

// Create an atomic order
// Replace makerId, takerId and ledgerId with your addresses.
app.post('/atomic-order', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    const ledgerId = '0x43Eed039351019D4B318BdFa97d0D6747Da49Aa8'; // replace with your deployed asset ledger.
    const makerId = '0xe96D860C8BBB30F6831E6E65d327295B7A0C524f'; // replace with your maker account.
    const takerId = '0x37f5fd03088748cfe5e64614ce8f920221da8a41'; // replace with your taker account.
    const orderGatewayId = '0x90A8D7e2138ABB28393906Ae162238B5A18fE846'; // testnet order gateway

    const provider2 = new HttpProvider({
        url: 'http://127.0.0.1:8545',
        accountId: '0x37f5fd03088748cfe5e64614ce8f920221da8a41',
        requiredConfirmations: 1
    });

    const orderGateway1 = OrderGateway.getInstance(provider, orderGatewayId);
    const orderGateway2 = OrderGateway.getInstance(provider2, orderGatewayId);

    const ledger1 = AssetLedger.getInstance(provider, ledgerId);
    
    let mutation = await ledger1.approveAccount('1', orderGateway1);
    console.log(mutation.id);
    await mutation.complete();
    console.log('completed');
    mutation = await ledger1.grantAbilities(orderGateway1, [GeneralAssetLedgerAbility.CREATE_ASSET]);
    console.log(mutation.id);
    await mutation.complete();
    console.log('completed');

    const order = {
        makerId,
        takerId,
        actions: [
            {
                kind: OrderActionKind.CREATE_ASSET,
                ledgerId: ledgerId,
                receiverId: takerId,
                assetId: '2',
                assetImprint: '973124ffc4a03e66d6a4458e587d5d6146f71fc57f359c8d516e0b12a50ab0d9',
            },
            {
                kind: OrderActionKind.TRANSFER_ASSET,
                ledgerId: ledgerId,
                senderId: makerId,
                receiverId: takerId,
                assetId: '1'
            },
        ],
        seed: Date.now(), // unique order identification
        expiration: Date.now() + 60 * 60 * 24, // 1 day
    } as Order;

    const signedClaim = await orderGateway1.claim(order);
    mutation = await orderGateway2.perform(order, signedClaim);

    res.send(mutation.id);
});

// Get asset ledger information
app.get('/ledgerInfo', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.query.assetLedgerId);
    
    const info = await ledger.getInfo();
    res.send(info);
});

// Get asset information
app.get('/assetInfo', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.query.assetLedgerId);
    
    const info = await ledger.getAsset(req.query.id);
    res.send(info);
});

// Get asset owner address
app.get('/assetOwner', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.query.assetLedgerId);
    
    const account = await ledger.getAssetAccount(req.query.id);
    res.send(account);
});

// Get number of assets an address owns
app.get('/balance', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.query.assetLedgerId);
    
    const balance = await ledger.getBalance(req.query.owner);
    res.send(balance);
});

app.listen(port, () => {
    console.log(`server started at http://localhost:${ port }`);
});
