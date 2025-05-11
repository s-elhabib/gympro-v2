import React from 'react';
import { Input } from './ui/input';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { CalendarPlus } from 'lucide-react';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

interface MemberSearchProps {
  onSelect: (member: Member) => void;
  defaultValue?: string;
  showSelectedOnly?: boolean;
}

const MemberSearch = ({ onSelect, defaultValue, showSelectedOnly = false }: MemberSearchProps) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [members, setMembers] = React.useState<Member[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  // Fetch initial members when focused
  const fetchInitialMembers = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('members')
      .select('id, first_name, last_name')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    setMembers(data || []);
    setIsLoading(false);
  };

  // Search members
  const searchMembers = async (term: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('members')
      .select('id, first_name, last_name')
      .eq('status', 'active')
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
      .limit(10);

    setMembers(data || []);
    setIsLoading(false);
  };

  React.useEffect(() => {
    if (searchTerm) {
      const debounceTimer = setTimeout(() => searchMembers(searchTerm), 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch member name if defaultValue is provided
  React.useEffect(() => {
    if (defaultValue) {
      const fetchMember = async () => {
        const { data } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .eq('id', defaultValue)
          .single();

        if (data) {
          setSelectedMember(data);
          setSearchTerm(`${data.first_name} ${data.last_name}`);
        }
      };
      fetchMember();
    } else {
      // Initialize with empty string to avoid uncontrolled to controlled warning
      setSearchTerm('');
      setSelectedMember(null);
    }
  }, [defaultValue]);

  const handleFocus = () => {
    if (showSelectedOnly && selectedMember) {
      return;
    }

    setIsFocused(true);
    if (!searchTerm) {
      fetchInitialMembers();
    }
  };

  const handleSelect = (member: Member) => {
    console.log("MemberSearch - handleSelect called with:", member);
    setSelectedMember(member);
    setSearchTerm(`${member.first_name} ${member.last_name}`);
    setIsFocused(false);
    onSelect(member);
    console.log("MemberSearch - onSelect callback called");
  };

  return (
    <div ref={searchRef} className="relative">
      <Input
        type="text"
        placeholder="Rechercher des membres..."
        value={searchTerm}
        onChange={(e) => {
          if (showSelectedOnly && selectedMember) return;
          setSearchTerm(e.target.value);
          if (selectedMember) {
            setSelectedMember(null);
          }
        }}
        onFocus={handleFocus}
        className="w-full"
        readOnly={showSelectedOnly && !!selectedMember}
      />

      {isFocused && (members.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span className="ml-2">Chargement des membres...</span>
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelect(member)}
                >
                  {`${member.first_name} ${member.last_name}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberSearch;