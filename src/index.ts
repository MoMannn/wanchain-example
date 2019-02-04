import express from 'express';
import bodyParser from 'body-parser';
import { HttpProvider } from '@0xcert/ethereum-http-provider';
import { AssetLedger } from '@0xcert/ethereum-asset-ledger';

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const port = 8080;
const provider = new HttpProvider({
    url: 'http://127.0.0.1:8545',
    accountId: '0xe96D860C8BBB30F6831E6E65d327295B7A0C524f',
    requiredConfirmations: 1
});

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

app.get('/ledgerInfo', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.query.assetLedgerId);
    
    const info = await ledger.getInfo();
    res.send(info);
});

app.get('/assetInfo', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.query.assetLedgerId);
    
    const info = await ledger.getAsset(req.query.id);
    res.send(info);
});

app.get('/assetOwner', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const ledger = AssetLedger.getInstance(provider, req.query.assetLedgerId);
    
    const account = await ledger.getAssetAccount(req.query.id);
    res.send(account);
});

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
