import { browser, element, by, By, ExpectedConditions as until, $, $$, ElementFinder } from 'protractor';
import * as ui from '../../ui'
import { Button, TextInput, LauncherSection, BaseElement } from '../../ui';
import * as support from '../../support'


export class Wizard extends ui.BaseElement {

  footer = new ui.BaseElement(this.$('div.modal-footer'));
  primaryButton = new ui.Button(this.footer.$('button.btn.btn-primary.wizard-pf-next'), 'Next')

  constructor(element: ElementFinder, name: string = '') {
    super(element, name);
  }

  async ready() {
    await super.ready();
    await this.footer.ready();
    await this.primaryButton.ready();
  }

}

export interface ProjectDetail {
  project: string;
  name?: string;
  strategy?: string;
}


const PROJECT_CARD = 'div.card-pf';

export class QuickStartWizard extends Wizard {
  filterTextInput = new ui.TextInput(this.$('input[type="text"]'), 'filter')

  // TODO: may be turn this into a widget
  projectSelector = new ui.BaseElement(this.$('ob-project-select'))
  projectCards = new ui.BaseElementArray(this.projectSelector.$$(PROJECT_CARD))

  projectInfoStep = new ui.BaseElement(this.$('project-info-step'))
  // we worry about proj
  projectNameInput = new ui.TextInput(this.projectInfoStep.$('#named'))

  // tslint:disable:max-line-length
  release = new Button(element(by.xpath('.//*[@value=\'Release\']')));
  releaseAndStage = new Button(element(by.xpath('.//*[@value=\'Release and Stage\']')));
  releaseStageApproveAndPromote = new Button(element(by.xpath('.//*[@value=\'Release, Stage, Approve and Promote\']')));
  // tslint:enable:max-line-length

  async ready() {
    await super.ready();
    this.debug(' .... wizard ', 'ok')
    await this.footer.ready()
    this.debug(' .... footer ', 'ok')

    await this.filterTextInput.ready();
    await this.projectSelector.ready()
    this.debug(' .... selection ', 'ok')
    await this.projectCards.ready();
    this.debug(' .... cards ', 'ok')
  }

  async findCard(name: string): Promise<ui.Clickable> {
    support.debug(' .... finding card', name)
    let cardFinder = by.cssContainingText(PROJECT_CARD, name);
    let element = this.projectSelector.element(cardFinder)
    let card = new ui.Clickable(element, name);
    await card.ready();
    support.debug(' .... found card', name)
    return card;
  }

  async waitForProjectInfoStep() {
    await this.projectInfoStep.ready()
    await this.projectNameInput.ready()
    await this.primaryButton.ready()
  }

  async newProject({ project, name = '', strategy }: ProjectDetail) {
    let card = await this.findCard(project);
    await card.clickWhenReady()

    await this.primaryButton.clickWhenReady();
    await this.waitForProjectInfoStep()

    await this.projectNameInput.enterText(name);
    await this.primaryButton.clickWhenReady();

    /* Set the release strategy */

    switch (strategy) {
      case 'releaseStageApproveAndPromote': {
        await this.releaseStageApproveAndPromote.clickWhenReady();
        break;
      }
      case 'releaseAndStage': {
        await this.releaseAndStage.clickWhenReady();
        break;
      }
      case 'release': {
        await this.release.clickWhenReady();
        break;
      }
      default: {
        await this.releaseStageApproveAndPromote.clickWhenReady();
        break;
      }
    }

    await this.primaryButton.clickWhenReady();
    await this.primaryButton.untilTextIsPresent('Finish');

    // call it 'Finish' to match what is seen on UI
    this.primaryButton.name = 'Finish';
    await this.primaryButton.clickWhenReady();

    await this.primaryButton.untilTextIsPresent('Ok');

    // call it 'Ok' to match what is seen on UI
    this.primaryButton.name = 'Ok';
    await this.primaryButton.clickWhenReady();
  }
}

export interface RepoDetail {
  org: string
  repositories: string[]
};

export class ImportCodeWizard extends Wizard {

  githubOrg = new ui.SingleSelectionDropdown(
    this.$('organisation-step single-selection-dropdown'), 'Github Org')

  repoList = new ui.MultipleSelectionList(
    this.$('multiple-selection-list'), 'Repository List')

  async ready() {
    await super.ready();
  }

  async waitForGithubOrg() {
    await this.githubOrg.ready();

  }

  async importCode({ org, repositories }: RepoDetail) {
    await this.primaryButton.ready()
    await this.waitForGithubOrg()
    await this.githubOrg.select(org);
    await this.primaryButton.clickWhenReady();

    await this.repoList.ready();
    repositories.forEach(async (r) => await this.repoList.select(r))
    await this.primaryButton.clickWhenReady()
    // deployment choose default
    await this.primaryButton.clickWhenReady()

    await this.primaryButton.untilTextIsPresent('Finish');
    this.primaryButton.name = 'Finish';
    await this.primaryButton.clickWhenReady()

    await this.primaryButton.untilTextIsPresent('Ok');
    this.primaryButton.name = 'Ok';
    await this.primaryButton.clickWhenReady();
  }

}

export class AddToSpaceDialog extends ui.ModalDialog {

  noThanksButton = new ui.Button($('#noThanksButton'), 'No Thanks ...');
  importExistingCodeButton = new ui.Button(
    $('#importCodeButton'), 'Import Existing Code');

  newQuickstartButton = new ui.Button(
    $('#forgeQuickStartButton'), 'New Quickstart Project');

  // NOTE: not visible initially
  quickStartWizard = new QuickStartWizard(this.$('quickstart-wizard'))
  importCodeWizard = new ImportCodeWizard(this.$('import-wizard'))

  newImportExperienceButton = new ui.Button(
    this.element(by.xpath('//*[contains(text(),\'New Import Experience\')]')),
    'New Import Experience'
  );

  constructor(element: ElementFinder) {
    super(element, 'Add to Space Wizard');
  }

  async ready() {
    await super.ready();
    await this.noThanksButton.untilClickable();
    await this.importExistingCodeButton.untilClickable();
    await this.newQuickstartButton.untilClickable();
  }


  async newQuickstartProject(details: ProjectDetail) {
    await this.newQuickstartButton.clickWhenReady();
    await this.quickStartWizard.ready();
    await this.quickStartWizard.newProject(details);
  }

  async newQuickstartReleaseProject(details: ProjectDetail) {
    await this.newQuickstartButton.clickWhenReady();
    await this.quickStartWizard.ready();
    await this.quickStartWizard.newReleaseProject(details);
  }

  async importExistingCode(details: RepoDetail) {
    await this.importExistingCodeButton.clickWhenReady();
    await this.importCodeWizard.ready();
    support.debug("... going to import repo", details.repositories)
    await this.importCodeWizard.importCode(details);
  }

  async openNewImportExperience(): Promise<NewImportExperienceDialog> {
    await this.newImportExperienceButton.clickWhenReady();
    return new NewImportExperienceDialog(this.element(by.xpath('//f8-add-app-overlay')));
  }

}

export class NewImportExperienceDialog extends ui.BaseElement {

  projectName = new TextInput($('#projectName'), 'Application Name');

  createNewApplicationCard = new BaseElement(
    element(by.xpath('//*[contains(text(),\'Create a New Application\')]' +
      '/ancestor::*[contains(@class,\'code-imports--step_content\')]')),
    'Create a New Application'
  );

  importExistingApplicationCard = new BaseElement(
    element(by.xpath('//*[contains(text(),\'Import Existing Application\')]' +
      '/ancestor::*[contains(@class,\'code-imports--step_content\')]')),
    'Import Existing Application'
  );

  constructor(elementFinder: ElementFinder) {
    super(elementFinder, 'New Import Experience Dialog');
  }

  async ready() {
    super.ready();
    this.projectName.ready();
  }

  async selectCreateNewApplication(): Promise<LauncherSection> {
    await this.createNewApplicationCard.clickWhenReady();
    return new LauncherSection(element(by.xpath('//f8-app-launcher')), 'Create a New Application Launcher');
  }
}

