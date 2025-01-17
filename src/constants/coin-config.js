import bchIcon from 'images/BCH_icon.png';
import btcIcon from 'images/BTC_icon.png';
import bsvIcon from 'images/BSV_icon.png';
import ltcIcon from 'images/LTC_icon.png';
import zecIcon from 'images/ZEC_icon.png';
import ethIcon from 'images/ETH_icon.png';
import btgIcon from 'images/BTG_icon.png';
import xrpIcon from 'images/XRP_icon.png';
import dashIcon from 'images/DASH_icon.png';
import xlmIcon from 'images/XLM_icon.png';

export default {
  allCoins: {
    btc: {
      fullName: 'Bitcoin',
      supportedRecoveries: ['bch', 'ltc', 'bsv'],
      icon: btcIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet', value: 'test' },
      ]
    },
    bch: {
      fullName: 'Bitcoin Cash',
      supportedRecoveries: ['btc', 'ltc', 'bsv'],
      icon: bchIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet', value: 'test' },
      ]
    },
    bsv: {
      fullName: 'Bitcoin SV',
      supportedRecoveries: ['btc', 'ltc', 'bch'],
      icon: bsvIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet', value: 'test' },
      ]
    },
    ltc: {
      fullName: 'Litecoin',
      supportedRecoveries: ['btc', 'bch', 'bsv'],
      icon: ltcIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet', value: 'test' },
      ]
    },
    btg: {
      fullName: 'Bitcoin Gold',
      supportedRecoveries: [],
      icon: btgIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
      ]
    },
    zec: {
      fullName: 'Zcash',
      supportedRecoveries: [],
      icon: zecIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet', value: 'test' }
      ]
    },
    xrp: {
      fullName: 'Ripple',
      supportedRecoveries: [],
      icon: xrpIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet', value: 'test' }
      ]
    },
    dash: {
      fullName: 'Dash',
      supportedRecoveries: [],
      icon: dashIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet', value: 'test' }
      ]
    },
    xlm: {
      fullName: 'Stellar',
      supportedRecoveries: [],
      icon: xlmIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet', value: 'test' }
      ]
    },
    eth: {
      fullName: 'Ethereum',
      supportedRecoveries: ['btc'],
      icon: ethIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet (Kovan)', value: 'test' }
      ]
    },
    token: {
      fullName: 'ERC20 Token',
      supportedRecoveries: [],
      icon: ethIcon,
      envOptions: [
        { label: 'Mainnet', value: 'prod' },
        { label: 'Testnet (Kovan)', value: 'test' }
      ]
    }
  },
  supportedRecoveries: {
    crossChain: ['btc', 'bch', 'ltc', 'bsv'],
    nonBitGo: ['btc', 'eth', 'xrp', 'bch', 'xlm', 'ltc', 'dash', 'zec', 'btg', 'token'],
    unsignedSweep: ['btc', 'bch', 'ltc', 'xrp', 'xlm', 'dash', 'zec', 'btg', 'eth', 'token'],
    migrated: {
      test: ['bch', 'bsv'],
      prod: ['bch', 'btg', 'bsv']
    }
  }
}
