import { LightningElement, wire } from 'lwc';
import getRecord from 'lightning/uiRecordApi';
import getPropostasByAccount from '@salesforce/apex/PropostaController.getPropostasByAccount';
import iniciarOnboarding from '@salesforce/apex/PropostaController.iniciarOnboarding';
import metodoNuncaUsado from '@salesforce/apex/PropostaController.metodoNuncaUsado';

export default class TestWizard extends LightningElement {
    accountId;

    @wire(getPropostasByAccount, { accountId: '$accountId' })
    propostas;

    handleSubmit() {
        iniciarOnboarding({ cnpj: this.cnpj });
    }
}
