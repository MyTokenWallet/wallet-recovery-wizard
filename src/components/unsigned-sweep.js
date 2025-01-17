import React, { Component } from 'react';
import Select from 'react-select';
import { InputField, InputTextarea, CoinDropdown, FieldTooltip } from './form-components';
import { Form, Button, Row, Col, FormGroup, Label } from 'reactstrap';
import classNames from 'classnames';
import ErrorMessage from './error-message';

import tooltips from 'constants/tooltips';
import coinConfig from 'constants/coin-config';
import krsProviders from 'constants/krs-providers';

const fs = window.require('fs');
const formTooltips = tooltips.unsignedSweep;
const { dialog } = window.require('electron').remote;
const utxoLib = require('bitgo-utxo-lib');

class UnsignedSweep extends Component {
  state = {
    coin: 'btc',
    userKey: '',
    userKeyID: '',
    backupKey: '',
    backupKeyID: '',
    bitgoKey: '',
    rootAddress: '',
    walletContractAddress: '',
    tokenAddress: '',
    walletPassphrase: '',
    recoveryDestination: '',
    scan: 20,
    krsProvider: null,
    env: 'test'
  };

  displayedParams = {
    btc: ['userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'bitgoKey', 'recoveryDestination', 'scan'],
    bch: ['userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'bitgoKey', 'recoveryDestination', 'scan'],
    ltc: ['userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'bitgoKey', 'recoveryDestination', 'scan'],
    btg: ['userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'bitgoKey', 'recoveryDestination', 'scan'],
    zec: ['userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'bitgoKey', 'recoveryDestination', 'scan'],
    dash: ['userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'bitgoKey', 'recoveryDestination', 'scan'],
    eth: ['userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'walletContractAddress', 'recoveryDestination'],
    xrp: ['userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'rootAddress', 'recoveryDestination'],
    xlm: ['userKey', 'backupKey', 'rootAddress', 'recoveryDestination'],
    token: ['userKey', 'backupKey', 'walletContractAddress', 'tokenContractAddress', 'recoveryDestination']
  };

  getCoinObject = () => {
    let coin;
    if (this.state.coin === 'token') {
      try {
        coin = this.props.bitgo.coin(this.state.tokenAddress);
      } catch (e) {
        // if we're here, the token address is malformed. let's set the coin to ETH so we can still validate addresses
        let coinTicker = this.state.env === 'test' ? 'teth' : 'eth';
        coin = this.props.bitgo.coin(coinTicker);
      }
    } else {
      let coinTicker = this.state.env === 'test' ? `t${this.state.coin}` : this.state.coin;
      coin = this.props.bitgo.coin(coinTicker);
    }

    return coin;
  }

  updateRecoveryInfo = (field) => (value) => {
    this.setState({ [field]: value });
  }

  updateEnv = (option) => {
    this.setState({ env: option.value });
  }

  updateCoin = (option) => {
    this.setState({ coin: option.value });
  }

  isDerivationPath = (derivationId, keyName) => {
    const derivationPathMessage = 'Is the provided value a Derivation Path or a Seed?\n' + keyName + ': ' + derivationId + '\n';

    if (derivationId.length > 2 && derivationId.indexOf('m/') === 0) {
      const response = dialog.showMessageBox({
        type: 'question',
        buttons: ['Derivation Path', 'Seed'],
        title: 'Derivation Path?',
        message: derivationPathMessage
      });

      return response === 0;
    }

    return false;
  };

  deriveKeyByPath = (key, path, ) => {
    try {
      const node = utxoLib.HDNode.fromBase58(key);
      const derivedNode = node.derivePath(path);
      return derivedNode.toBase58();
    } catch(err) {
      console.dir(err);
      throw err;
    }
  }

  // If the user and/or backup keys are derived with a KeyID, we need to derive the proper key from that
  updateKeysFromIDs = (basecoin, recoveryParams) => {
    const keyInfo = [{
      id: recoveryParams.userKeyID,
      key: recoveryParams.userKey,
      description: 'User Key ID',
      name: 'userKey'
    }, {
      id: recoveryParams.backupKeyID,
      key: recoveryParams.backupKey,
      description: 'Backup Key ID',
      name: 'backupKey'
    }];

    keyInfo.forEach((keyObj) => {
      if (keyObj.id && keyObj.id !== '') {
        if (this.isDerivationPath(keyObj.id, keyObj.description)) {
          recoveryParams[keyObj.name] = this.deriveKeyByPath(keyObj.key, keyObj.id);
        } else {
          const response = basecoin.deriveKeyWithSeed({ key: keyObj.key, seed: keyObj.id });
          recoveryParams[keyObj.name] = response.key;
        }
        // once we've derived the key, then delete the keyID so we don't pass it through to the SDK
        delete recoveryParams[keyObj.name + 'ID'];
      }
    });
  }

  async performRecovery() {
    this.setState({ recovering: true, error: '' });

    let baseCoin = await this.getCoinObject();

    this.props.bitgo.env = this.state.env;

    const recoveryTool = baseCoin.recover;

    if (!recoveryTool) {
      this.setState({ error: `Recovery tool not found for ${this.state.coin}`, recovering: false });
      return;
    }

    try {
      // This is like _.pick
      const recoveryParams = [
        'userKey', 'userKeyID', 'backupKey', 'backupKeyID', 'bitgoKey', 'rootAddress',
        'walletContractAddress', 'tokenAddress',
        'recoveryDestination', 'scan'
      ].reduce((obj, param) => {
        if (this.state[param]) {
          let value = this.state[param];

          return Object.assign(obj, { [param]: value })
        }

        return obj;
      }, {});

      this.updateKeysFromIDs(baseCoin, recoveryParams);

      const recoveryPrebuild = await baseCoin.recover(recoveryParams);

      const fileName = baseCoin.getChain() + "-unsigned-sweep-" + Date.now().toString() + ".json";
      const dialogParams = {
        filters: [{
          name: 'Custom File Type',
          extensions: ['json']
        }],
        defaultPath: '~/' + fileName
      };

      // Retrieve the desired file path and file name
      const filePath = dialog.showSaveDialog(dialogParams);
      if (!filePath) {
        // TODO: The user exited the file creation process. What do we do?
        return;
      }

      fs.writeFileSync(filePath, JSON.stringify(recoveryPrebuild, null, 4), 'utf8');
      this.setState({ recovering: false, done: true, finalFilename: filePath });
    } catch (e) {
      this.setState({ error: e.message, recovering: false });
    }
  }

  resetRecovery = () => {
    this.setState({
      userKey: '',
      backupKey: '',
      walletContractAddress: '',
      rootAddress: '',
      tokenAddress: '',
      walletPassphrase: '',
      recoveryDestination: '',
      env: 'test',
      done: false,
      error: ''
    })
  }

  render() {
    const recoveryCoins = coinConfig.supportedRecoveries.unsignedSweep;
    const { isLoggedIn } = this.props;

    return (
      <div className={classNames(isLoggedIn || 'content-centered')}>
        <h1 className='content-header'>Build Unsigned Sweep</h1>
        <p className='subtitle'>This tool will construct an unsigned sweep transaction on the wallet you specify without using BitGo.</p>
        <hr />
        <Form>
          <Row>
            <Col xs={5}>
              <CoinDropdown
                label='Wallet Type'
                name='coin'
                allowedCoins={recoveryCoins}
                onChange={this.updateCoin}
                value={this.state.coin}
              />
            </Col>
            <Col xs={3}>
              <FormGroup>
                <Label className='input-label'>
                  Environment
                </Label>
                <Select
                  type='select'
                  className='bitgo-select'
                  options={coinConfig.allCoins[this.state.coin].envOptions}
                  onChange={this.updateEnv}
                  name={'env'}
                  value={this.state.env}
                  clearable={false}
                  searchable={false}
                />
              </FormGroup>
            </Col>
          </Row>
          {this.displayedParams[this.state.coin].includes('userKey') &&
          <InputField
            label='User Public Key'
            name='userKey'
            value={this.state.userKey}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.userKey}
            disallowWhiteSpace={true}
            format='pub'
          />
          }

          {this.displayedParams[this.state.coin].includes('userKeyID') &&
          <InputField
            label='User Key ID (optional)'
            name='userKeyID'
            value={this.state.userKeyID}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.userKeyID}
            disallowWhiteSpace={false}
          />
          }

          {this.displayedParams[this.state.coin].includes('backupKey') &&
            <InputField
              label='Backup Public Key'
              name='backupKey'
              value={this.state.backupKey}
              onChange={this.updateRecoveryInfo}
              tooltipText={formTooltips.backupPublicKey}
              disallowWhiteSpace={true}
              format='pub'
            />
          }

          {this.displayedParams[this.state.coin].includes('backupKeyID') &&
          <InputField
            label='Backup Key ID (optional)'
            name='backupKeyID'
            value={this.state.backupKeyID}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.backupKeyID}
            disallowWhiteSpace={false}
          />
          }

          {this.displayedParams[this.state.coin].includes('bitgoKey') &&
          <InputField
            label='BitGo Public Key'
            name='bitgoKey'
            value={this.state.bitgoKey}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.bitgoKey}
            disallowWhiteSpace={true}
            format='pub'
          />
          }

          {this.displayedParams[this.state.coin].includes('rootAddress') &&
          <InputField
            label='Root Address'
            name='rootAddress'
            value={this.state.rootAddress}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.rootAddress}
            disallowWhiteSpace={true}
            format='address'
            coin={this.getCoinObject()}
          />
          }

          {this.displayedParams[this.state.coin].includes('walletContractAddress') &&
          <InputField
            label='Wallet Contract Address'
            name='walletContractAddress'
            value={this.state.walletContractAddress}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.walletContractAddress}
            disallowWhiteSpace={true}
            format='address'
            coin={this.getCoinObject()}
          />
          }

          {this.displayedParams[this.state.coin].includes('tokenContractAddress') &&
          <InputField
            label='Token Contract Address'
            name='tokenAddress'
            value={this.state.tokenAddress}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.tokenAddress}
            disallowWhiteSpace={true}
            format='address'
            coin={this.getCoinObject()}
          />
          }

          {this.displayedParams[this.state.coin].includes('walletPassphrase') &&
          <InputField
            label='Wallet Passphrase'
            name='walletPassphrase'
            value={this.state.walletPassphrase}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.walletPassphrase}
            isPassword={true}
          />
          }

          {this.displayedParams[this.state.coin].includes('recoveryDestination') &&
          <InputField
            label='Destination Address'
            name='recoveryDestination'
            value={this.state.recoveryDestination}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.recoveryDestination}
            disallowWhiteSpace={true}
            format='address'
            coin={this.getCoinObject()}
          />
          }

          {this.displayedParams[this.state.coin].includes('scan') &&
          <InputField
            label='Address Scanning Factor'
            name='scan'
            value={this.state.scan}
            onChange={this.updateRecoveryInfo}
            tooltipText={formTooltips.scan}
            disallowWhiteSpace={true}
            format='number'
          />
          }

          {this.state.error && <ErrorMessage>{this.state.error}</ErrorMessage>}
          {this.state.done && <p className='recovery-logging'>Completed constructing recovery transaction. Saved recovery file: {this.state.finalFilename}</p>}
          {!this.state.done &&
          <Button onClick={this.performRecovery.bind(this)} disabled={this.state.recovering} className='bitgo-button'>
            {this.state.recovering ? 'Recovering...' : 'Recover Funds'}
          </Button>
          }
          {this.state.done &&
          <Button onClick={this.resetRecovery} className='bitgo-button'>
            Perform Another Recovery
          </Button>
          }
        </Form>
      </div>
    )
  }
}

export default UnsignedSweep;
