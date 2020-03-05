import React, {Component} from 'react';
import Web3 from 'web3';
import Web3Connect from 'web3connect';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Portis from '@portis/web3';
import Fortmatic from 'fortmatic';
import Torus from '@toruslabs/torus-embed';

import keys from './keys';

import './layout/config/_base.sass';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: keys.infura
    }
  },
  portis: {
    package: Portis,
    options: {
      id: keys.portis
    }
  },
  fortmatic: {
    package: Fortmatic,
    options: {
      key: keys.fortmatic
    }
  },
  torus: {
    package: Torus,
    options: {
      enableLogging: false,
      buttonPosition: "bottom-left",
      buildEnv: "production",
      showTorusButton: true,
      enabledVerifiers: {
        google: false
      }
    }
  }
};

function initWeb3(provider) {
  const web3 = new Web3(provider)

  web3.eth.extend({
    methods: [
      {
        name: 'chainId',
        call: 'eth_chainId',
        outputFormatter: web3.utils.hexToNumber
      }
    ]
  })

  return web3
}

class App extends Component {
  web3Connect;

  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      provider: null,
      connected: null,
      address: null,
      chainId: null,
      networkId: null
    }

    this.web3Connect = new Web3Connect.Core({
      network: "mainnet",
      cacheProvider: true,
      providerOptions
    });
  } 

  componentDidMount = async () => {  
    if (this.web3Connect.cachedProvider) {
      this.onConnect()
    }
  }

  onConnect = async () => {
    const provider = await this.web3Connect.connect();

    await this.subscribeProvider(provider);

    const web3 = initWeb3(provider);

    const accounts = await web3.eth.getAccounts();

    const address = accounts[0];

    const networkId = await web3.eth.net.getId();

    const chainId = await web3.eth.chainId();

    await this.setState({
      web3,
      provider,
      connected: true,
      address,
      chainId,
      networkId
    });

    console.log(this.state.address);
  }

  subscribeProvider = async (provider) => {
    provider.on('close', () => this.disconnect());

    provider.on('accountsChanged', async (accounts) => {
      await this.setState({ address: accounts[0] });
    });

    provider.on('chainChanged', async (chainId) => {
      const { web3 } = this.state
      const networkId = await web3.eth.net.getId()
      await this.setState({ chainId, networkId });
    });

    provider.on('networkChanged', async (networkId) => {
      const { web3 } = this.state;
      const chainId = await web3.eth.chainId();
      await this.setState({ chainId, networkId });
    });
  }

  disconnect = async () => {
    const { web3 } = this.state
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close()
    }
    await this.web3Connect.clearCachedProvider();
    this.setState({connected: false, address: null});
  }

  render() {
    let buttonText;

    if(this.state.address) {
      buttonText = `${this.state.address.slice(0, 4)}...${this.state.address.slice(this.state.address.length - 4, this.state.address.length)}`
    } else {
      buttonText = 'Connect Wallet'
    }

    return (
      <div className="app">
        <h1>Wallet Connect</h1>
        <button onClick={this.state.connected ? this.disconnect : this.onConnect}>
          {buttonText}
        </button>
      </div>
    );
  }
}

export default App;
