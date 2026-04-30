import { format } from 'date-fns';

/**
 * Builds the <Order> XML string for Quest ESP based on verified working sample.
 * This XML is passed as a string parameter to the CreateOrder SOAP method.
 */
export const buildCreateOrderXml = (orderData) => {
    const { employee, test, collectionSite, clientReferenceId } = orderData;
    
    // Formatting as per verified working sample (YYYY/MM/DD)
    const formattedDob = format(new Date(employee.dob), 'yyyy/MM/dd');

    return `<Order>
 <EventInfo>
  <CollectionSiteID>${collectionSite.siteId || ''}</CollectionSiteID>
  <EmailAuthorizationAddresses>
   <EmailAddress>${employee.email}</EmailAddress>
  </EmailAuthorizationAddresses>
  <EndDateTime></EndDateTime>
  <EndDateTimeTimeZoneID></EndDateTimeTimeZoneID>
 </EventInfo>
 <DonorInfo>
  <FirstName>${employee.firstName.toUpperCase()}</FirstName>
  <MiddleName></MiddleName>
  <LastName>${employee.lastName.toUpperCase()}</LastName>
  <PrimaryID>${employee.ssnLast4 || 'TEST123'}</PrimaryID>
  <PrimaryIDType>EIN</PrimaryIDType>
  <DOB>${formattedDob}</DOB>
  <PrimaryPhone>${employee.phone.replace(/[^0-9]/g, '')}</PrimaryPhone>
  <SecondaryPhone></SecondaryPhone>
 </DonorInfo>
 <ClientInfo>
  <ContactName>System Admin</ContactName>
  <TelephoneNumber>9887123123</TelephoneNumber>
  <LabAccount>${test.accountNumber}</LabAccount>
  <CSL></CSL>
 </ClientInfo>
 <TestInfo>
  <ClientReferenceID>${clientReferenceId}</ClientReferenceID>
  <DOTTest>${test.isDOT ? 'Y' : 'N'}</DOTTest>
  <TestingAuthority></TestingAuthority>
  <ReasonForTestID>1</ReasonForTestID>
  <PhysicalReasonForTestID></PhysicalReasonForTestID>
  <ObservedRequested>N</ObservedRequested>
  <SplitSpecimenRequested>N</SplitSpecimenRequested>
  <CSOs></CSOs>
  <OrderComments></OrderComments>
  <Screenings>
   <UnitCodes>
    <UnitCode>${test.testCode}</UnitCode>
   </UnitCodes>
  </Screenings>
 </TestInfo>
 <ClientCustom>
  <ResponseURL></ResponseURL>
 </ClientCustom>
</Order>`;
};
