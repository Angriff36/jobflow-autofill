const FIELDS = {
      personal: ['firstName','lastName','email','phone','address','city','state','zip','country','linkedIn','portfolio','github'],
      work: ['currentCompany','currentTitle'],
      education: ['school','degree','major'],
      eeo: ['gender','pronouns','veteran','disability'],
      preferences: ['salary','startDate','authorized','sponsorship','relocate']
    };

    // Load existing profile
    chrome.storage.local.get('profile', (result) => {
      if (!result.profile) return;
      const p = result.profile;
      // Personal
      if (p.personal) {
        for (const f of FIELDS.personal) {
          const el = document.getElementById(f);
          if (el) {
            if (f === 'address') el.value = p.personal.location?.address || '';
            else if (f === 'city') el.value = p.personal.location?.city || '';
            else if (f === 'state') el.value = p.personal.location?.state || '';
            else if (f === 'zip') el.value = p.personal.location?.zip || '';
            else if (f === 'country') el.value = p.personal.location?.country || '';
            else el.value = p.personal[f] || '';
          }
        }
      }
      if (p.work) { for (const f of FIELDS.work) { const el = document.getElementById(f); if (el) el.value = p.work[f] || ''; } }
      if (p.education) { for (const f of FIELDS.education) { const el = document.getElementById(f); if (el) el.value = p.education[f] || ''; } }
      if (p.eeo) { for (const f of FIELDS.eeo) { const el = document.getElementById(f); if (el) el.value = p.eeo[f] || ''; } }
      if (p.preferences) { for (const f of FIELDS.preferences) { const el = document.getElementById(f); if (el) el.value = p.preferences[f] || ''; } }
    });

    // Save
    document.getElementById('saveBtn').addEventListener('click', () => {
      const v = (id) => document.getElementById(id)?.value?.trim() || '';
      const profile = {
        personal: {
          firstName: v('firstName'), lastName: v('lastName'), email: v('email'), phone: v('phone'),
          location: { address: v('address'), city: v('city'), state: v('state'), zip: v('zip'), country: v('country') },
          linkedIn: v('linkedIn'), portfolio: v('portfolio'), github: v('github'), website: v('portfolio'),
        },
        work: { currentCompany: v('currentCompany'), currentTitle: v('currentTitle') },
        education: { school: v('school'), degree: v('degree'), major: v('major') },
        eeo: { gender: v('gender'), pronouns: v('pronouns'), veteran: v('veteran'), disability: v('disability') },
        preferences: { salary: v('salary'), startDate: v('startDate'), authorized: v('authorized'), sponsorship: v('sponsorship'), relocate: v('relocate') },
      };

      chrome.storage.local.set({ profile }, () => {
        const st = document.getElementById('statusText');
        st.textContent = '✓ Profile saved!';
        st.className = 'status';
        setTimeout(() => { st.textContent = ''; }, 3000);
      });
    });