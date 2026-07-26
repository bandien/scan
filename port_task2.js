
    let staffList = [];
    let staffDirectory = [];
    
    async function loadStaff() {
      try {
        const cachedNames = localStorage.getItem('bandien_nhatky_staff_v2');
        if (cachedNames) {
          const arr = JSON.parse(cachedNames);
          if (Array.isArray(arr) && arr.length > 0) staffList = arr;
        }
        const cachedDir = localStorage.getItem('bandien_nhatky_staff_directory_v1');
        if (cachedDir) {
          const arr = JSON.parse(cachedDir);
          if (Array.isArray(arr) && arr.length > 0) staffDirectory = arr;
        }

        if (staffList.length === 0 || staffDirectory.length === 0) {
          try {
            const res = await fetch('../danhba_chuan_hoa.json');
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                staffDirectory = data;
                staffList = data.map(d => d.fullName).filter(Boolean);
              }
            }
          } catch (e) { console.warn('Lỗi đọc fallback danhba_chuan_hoa.json:', e); }
        }

        const res = await window.bdsApiFetch('getStaff', { force: true });
        if (res && res.status === 'success' && Array.isArray(res.data)) {
          staffDirectory = res.data;
          staffList = res.data.map(d => d.fullName).filter(Boolean);
          localStorage.setItem('bandien_nhatky_staff_v2', JSON.stringify(staffList));
          localStorage.setItem('bandien_nhatky_staff_directory_v1', JSON.stringify(staffDirectory));
          
          if (typeof currentOpenPlanId !== 'undefined' && currentOpenPlanId) {
            openTaskDetail(currentOpenPlanId);
          }
        }
      } catch (err) {
        console.error('Lỗi loadStaff:', err);
      }
    }

    function getShortName(fullName) {
      if (!fullName) return "";
      const raw = String(fullName).trim();
      if (!raw) return "";

      // 1. Tra cứu trực tiếp trong staffDirectory (danh bạ / tài khoản)
      const person = staffDirectory.find(p =>
        (p.name && p.name.toLowerCase() === raw.toLowerCase()) ||
        (p.username && p.username.toLowerCase() === raw.toLowerCase()) ||
        (p.shortName && p.shortName.toLowerCase() === raw.toLowerCase())
      );

      // Nếu có tên thường gọi riêng trong danh bạ (vd "Chiến", "Huy pb", "Huy đh")
      if (person && person.shortName && person.shortName.trim()) {
        const customShort = person.shortName.trim();
        // Kiểm tra xem tên gọi đó có bị trùng đơn thuần (vd 2 người cùng tên "Thắng") không
        const duplicates = staffDirectory.filter(p => p.shortName && p.shortName.trim().toLowerCase() === customShort.toLowerCase());
        if (duplicates.length <= 1) {
          return customShort;
        }
        // Nếu bị trùng tên ngắn đơn lẻ, chuyển sang format chuẩn phân biệt: [Tên] [Chữ cái đầu Họ/Đệm]
        return formatStandardShortName(person.name || raw);
      }

      // 2. Không có tên gọi riêng hoặc tên đầy đủ -> định dạng chuẩn ngắn gọn (vd "Nguyễn Quốc Thắng" ➔ "Thắng NQ", "Đinh Văn Hậu" ➔ "Hậu DV")
      return formatStandardShortName(raw);
    }

    function knownPeopleNames() {
      const names = new Set(staffList);
      allPlans.flatMap(p => String(p.assignee || '').split(',')).forEach(n => names.add(n.trim()));
      allPlans.flatMap(p => allPlanSteps(p)).forEach(step => (step.assignees || []).forEach(n => names.add(String(n || '').trim())));
      return [...names].filter(Boolean).sort();
    }

    function filterNamesByTag(names, tagVal) {
      const val = String(tagVal || "").trim().toLowerCase();
      if (!val) return names;
      const matches = names.filter(name => {
        const person = staffDirectory.find(p =>
          (p.name && p.name.toLowerCase() === name.toLowerCase()) ||
          (p.username && p.username.toLowerCase() === name.toLowerCase())
        );
        if (!person) return false;
        const dept = (person.dept || "").toLowerCase();
        const labels = (person.labels || "").toLowerCase();
        return (dept && (dept.includes(val) || val.includes(dept)))
          || (labels && (labels.includes(val) || val.includes(labels)));
      });
      return matches.length > 0 ? matches : names;
    }