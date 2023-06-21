const { Helius } = require("../dist/Helius");

const helius = new Helius("d0ac2c7a-063b-4923-920b-1aa3b1697c78");

const main = async () => {
    const x = await helius.rpc.getTokenHolders("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")

    console.log("x: ", x.length)
}

main();
